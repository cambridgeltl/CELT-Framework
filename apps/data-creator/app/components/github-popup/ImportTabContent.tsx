'use client';

import { useState, useRef, useEffect } from 'react';
import { useDictionary } from '../../contexts/DictionaryContext';
import { useConversations } from '../../contexts/ConversationsContext';
import { useCulture } from '../../contexts/CultureContext';
import { useDecks } from '../../contexts/DecksContext';
import { useImageStaging } from '../../contexts/ImageStagingContext';
import { useAudioStaging } from '../../contexts/AudioStagingContext';
import { Entry } from '../../models/Dictionary';
import MediaInstructions, { MediaCategory, isValidMediaFile } from './MediaInstructions';
import { Deck, Card as FlashCard } from '../../models/Deck';
import { getFilesFromDrop } from '../../utils/folderDrop';

type ImportType = 'dictionary' | 'conversations' | 'culture' | 'decks';

interface ImportResult {
  success: boolean;
  type: string;
  count: number;
  message: string;
}

interface ScannedFile {
  fileName: string;
  data: unknown;
  detected: ImportType | null;
  confidence: string;
  chosenType: ImportType;
}

// Detect what type of data the JSON contains
function detectDataType(data: unknown): { detected: ImportType | null; confidence: string } {
  if (!data || typeof data !== 'object') {
    return { detected: null, confidence: '' };
  }

  const obj = data as Record<string, unknown>;

  // Check for wrapped data with explicit keys
  if (obj.entries || obj.dictionary) {
    // Check if entries look like dictionary entries (have dz, en fields)
    const items = (obj.entries || obj.dictionary) as unknown[];
    if (Array.isArray(items) && items.length > 0) {
      const first = items[0] as Record<string, unknown>;
      if (first && (first.dz !== undefined || first.en !== undefined || first.pos !== undefined)) {
        return { detected: 'dictionary', confidence: 'Dictionary (has dz/en fields)' };
      }
    }
    return { detected: 'dictionary', confidence: 'Dictionary (has entries key)' };
  }

  if (obj.categories) {
    // Check if categories have conversations
    const cats = obj.categories as unknown[];
    if (Array.isArray(cats) && cats.length > 0) {
      const first = cats[0] as Record<string, unknown>;
      if (first && (first.conversations !== undefined || first.lines !== undefined)) {
        return { detected: 'conversations', confidence: 'Conversations (has categories with conversations)' };
      }
    }
    return { detected: 'conversations', confidence: 'Conversations (has categories key)' };
  }

  if (obj.conversations) {
    return { detected: 'conversations', confidence: 'Conversations (has conversations key)' };
  }

  if (obj.culture) {
    return { detected: 'culture', confidence: 'Culture (has culture key)' };
  }

  // Check for decks - need to distinguish between flashcard decks and culture decks
  if (obj.decks) {
    const decks = obj.decks as unknown[];
    if (Array.isArray(decks) && decks.length > 0) {
      const first = decks[0] as Record<string, unknown>;
      if (first && first.cards) {
        const cards = first.cards as unknown[];
        if (Array.isArray(cards) && cards.length > 0) {
          const firstCard = cards[0] as Record<string, unknown>;
          // Flashcard decks have front/back, culture has question/answer
          if (firstCard.front !== undefined || firstCard.back !== undefined) {
            return { detected: 'decks', confidence: 'Flashcard Decks (has front/back cards)' };
          }
          if (firstCard.question !== undefined || firstCard.answer !== undefined) {
            return { detected: 'culture', confidence: 'Culture (has question/answer cards)' };
          }
        }
      }
    }
    return { detected: 'decks', confidence: 'Decks (has decks key)' };
  }

  // Check for single flashcard deck object (has cards with front/back)
  if (obj.title && obj.cards) {
    const cards = obj.cards as unknown[];
    if (Array.isArray(cards) && cards.length > 0) {
      const firstCard = cards[0] as Record<string, unknown>;
      if (firstCard.front !== undefined || firstCard.back !== undefined) {
        return { detected: 'decks', confidence: 'Single Flashcard Deck' };
      }
      if (firstCard.question !== undefined || firstCard.answer !== undefined) {
        return { detected: 'culture', confidence: 'Single Culture Deck' };
      }
    }
    return { detected: 'decks', confidence: 'Single Deck' };
  }

  // Culture deck with steps (text, image, quiz-single, quiz-multi)
  if (obj.title && obj.steps) {
    return { detected: 'culture', confidence: 'Culture Deck (has steps)' };
  }

  // JSON Schema files — skip
  if (obj.$schema || obj.type === 'object' && obj.properties) {
    return { detected: null, confidence: 'JSON Schema file (not data)' };
  }

  // Check if it's an array
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;

    // Dictionary entry array (has dz/en)
    if (first.dz !== undefined || first.en !== undefined || first.pos !== undefined) {
      return { detected: 'dictionary', confidence: 'Dictionary entries array' };
    }

    // Conversation category array
    if (first.conversations !== undefined || first.lines !== undefined) {
      return { detected: 'conversations', confidence: 'Conversation categories array' };
    }

    // Deck array
    if (first.cards !== undefined && first.title !== undefined) {
      const cards = first.cards as unknown[];
      if (Array.isArray(cards) && cards.length > 0) {
        const firstCard = cards[0] as Record<string, unknown>;
        if (firstCard.front !== undefined || firstCard.back !== undefined) {
          return { detected: 'decks', confidence: 'Flashcard Decks array' };
        }
        if (firstCard.question !== undefined || firstCard.answer !== undefined) {
          return { detected: 'culture', confidence: 'Culture Decks array' };
        }
      }
    }
  }

  return { detected: null, confidence: '' };
}

/** Parse JSON leniently — strips trailing commas that strict JSON.parse rejects */
function lenientJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Strip trailing commas before } or ]
    const cleaned = text.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(cleaned);
  }
}

const typeLabels: Record<ImportType, string> = {
  dictionary: 'Dictionary',
  conversations: 'Conversations',
  culture: 'Culture',
  decks: 'Decks',
};

const DECKS_STORAGE_KEY = 'dzardzongke-decks';

function loadDeckFromStorage(id: string): Deck | null {
  try {
    const stored = localStorage.getItem(`${DECKS_STORAGE_KEY}-deck-${id}`);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    const cards = (parsed.cards || []).map((c: Record<string, unknown>) =>
      new FlashCard(c.id as string, c.front as string, c.back as string, (c.notes as string) || '', (c.image as string) || ''));
    return new Deck(parsed.id, parsed.title, parsed.description, cards);
  } catch { return null; }
}

export default function ImportTabContent() {
  const [selectedType, setSelectedType] = useState<ImportType>('dictionary');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [mismatchWarning, setMismatchWarning] = useState<{ detected: ImportType; confidence: string } | null>(null);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importEntries, entries } = useDictionary();
  const { importData: importConversationsData, categories, updateExchange } = useConversations();
  const { importData: importCultureData, decks: cultureDecks } = useCulture();
  const { importDecks, decks: deckMetas } = useDecks();
  const { stageImage } = useImageStaging();
  const { stageAudio } = useAudioStaging();

  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [mode, setMode] = useState<'json' | 'media' | 'mixed'>('json');
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>('deck-images');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [mediaResults, setMediaResults] = useState<Array<{
    filename: string;
    matched: boolean;
    matchedTo?: string;
    error?: string;
  }>>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [shouldProcessMedia, setShouldProcessMedia] = useState(false);
  // Track how many data sources were imported so we can wait for context updates
  const [importedDataTypes, setImportedDataTypes] = useState<Set<string>>(new Set());

  // Process media files AFTER JSON import completes and React state updates.
  // The key insight: context state (categories, entries, etc.) updates asynchronously.
  // We wait until the relevant data is actually available before processing media.
  useEffect(() => {
    if (!shouldProcessMedia || pendingMediaFiles.length === 0 || isImporting) return;

    // Check if imported data has propagated to contexts
    const hasConvData = !importedDataTypes.has('conversations') || categories.length > 0;
    const hasDictData = !importedDataTypes.has('dictionary') || entries.length > 0;
    const hasCultureData = !importedDataTypes.has('culture') || cultureDecks.length > 0;

    if (hasConvData && hasDictData && hasCultureData) {
      setShouldProcessMedia(false);
      setImportedDataTypes(new Set());
      processMediaFiles(pendingMediaFiles, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldProcessMedia, isImporting, entries, categories, cultureDecks, pendingMediaFiles]);

  const importData = async (data: unknown, type: ImportType): Promise<ImportResult> => {
    try {
      switch (type) {
        case 'dictionary': {
          // Handle wrapped data: { entries: [...] } or { dictionary: [...] } or direct array
          let items: unknown[] = [];
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const obj = data as Record<string, unknown>;
            if (obj.entries) items = obj.entries as unknown[];
            else if (obj.dictionary) items = obj.dictionary as unknown[];
            else items = [data];
          } else if (Array.isArray(data)) {
            items = data;
          }

          // Convert raw JSON to Entry objects
          const entries = items.map((item) => Entry.fromJSON(item));
          const validEntries = entries.filter(e => e.isValid());
          if (validEntries.length === 0) {
            return { success: false, type: 'Dictionary', count: 0, message: 'No valid entries found (need dz and en fields)' };
          }
          const count = importEntries(validEntries);
          return { success: count > 0, type: 'Dictionary', count, message: count > 0 ? `Imported ${count} dictionary entries` : 'All entries already exist or are invalid' };
        }

        case 'conversations': {
          // Conversations context expects JSON string with { categories: [...] }
          let jsonData: { categories: unknown[] };
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const obj = data as Record<string, unknown>;
            if (obj.categories) {
              jsonData = { categories: obj.categories as unknown[] };
            } else if (obj.conversations) {
              // Wrap as a single category if conversations array provided
              jsonData = { categories: [{ id: 'imported', title: 'Imported', description: '', conversations: obj.conversations }] };
            } else {
              jsonData = { categories: [data] };
            }
          } else if (Array.isArray(data)) {
            jsonData = { categories: data };
          } else {
            return { success: false, type: 'Conversations', count: 0, message: 'Invalid data format' };
          }

          const result = importConversationsData(JSON.stringify(jsonData));
          return { success: result.success, type: 'Conversations', count: jsonData.categories.length, message: result.message };
        }

        case 'culture': {
          // Culture context expects JSON string with { decks: [...] }
          let jsonData: { decks: unknown[] };
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const obj = data as Record<string, unknown>;
            if (obj.decks) {
              jsonData = { decks: obj.decks as unknown[] };
            } else if (obj.culture) {
              jsonData = { decks: obj.culture as unknown[] };
            } else if (obj.id && obj.title) {
              // Single deck
              jsonData = { decks: [data] };
            } else {
              jsonData = { decks: [data] };
            }
          } else if (Array.isArray(data)) {
            jsonData = { decks: data };
          } else {
            return { success: false, type: 'Culture Notes', count: 0, message: 'Invalid data format' };
          }

          const result = importCultureData(JSON.stringify(jsonData));
          return { success: result.success, type: 'Culture Notes', count: jsonData.decks.length, message: result.message };
        }

        case 'decks': {
          // Handle wrapped data or direct array
          let items: unknown[] = [];
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const obj = data as Record<string, unknown>;
            if (obj.decks) items = obj.decks as unknown[];
            else if (obj.title && obj.cards) items = [obj]; // Single deck
            else items = [data];
          } else if (Array.isArray(data)) {
            items = data;
          }

          if (items.length === 0) {
            return { success: false, type: 'Decks', count: 0, message: 'No deck data found' };
          }
          const count = importDecks(items);
          return { success: count > 0, type: 'Decks', count, message: count > 0 ? `Imported ${count} decks` : 'No valid decks found or all already exist' };
        }

        default:
          return { success: false, type: 'Unknown', count: 0, message: 'Unknown data type' };
      }
    } catch (error) {
      return { success: false, type, count: 0, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const processFile = async (file: File) => {
    setMismatchWarning(null);
    setPendingData(null);
    setResults([]);

    try {
      const text = await file.text();
      const data = lenientJsonParse(text);

      // Detect data type
      const { detected, confidence } = detectDataType(data);

      // Check for mismatch
      if (detected && detected !== selectedType) {
        setMismatchWarning({ detected, confidence });
        setPendingData(data);
        return;
      }

      // No mismatch, proceed with import
      setIsImporting(true);
      const result = await importData(data, selectedType);
      setResults([result]);
    } catch (error) {
      setResults([{
        success: false,
        type: 'Error',
        count: 0,
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsImporting(false);
    }
  };

  // Scan JSON files and show preview — does NOT import yet
  const scanJsonFiles = async (files: File[]) => {
    setMismatchWarning(null);
    setPendingData(null);
    setResults([]);
    setScannedFiles([]);

    const scanned: ScannedFile[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const data = lenientJsonParse(text);
        const { detected, confidence } = detectDataType(data);

        scanned.push({
          fileName: file.name,
          data,
          detected,
          confidence: detected ? confidence : 'Not recognized as language data',
          chosenType: detected || selectedType,
        });
      } catch {
        scanned.push({
          fileName: file.name,
          data: null,
          detected: null,
          confidence: 'Failed to parse JSON',
          chosenType: selectedType,
        });
      }
    }

    setScannedFiles(scanned);
  };

  // Change the chosen type for a scanned file
  const changeScannedFileType = (index: number, newType: ImportType) => {
    setScannedFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, chosenType: newType } : f
    ));
  };

  // Remove a scanned file from the list
  const removeScannedFile = (index: number) => {
    setScannedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Import all scanned files with their chosen types
  const confirmImportScanned = async () => {
    const validFiles = scannedFiles.filter(f => f.data !== null);
    if (validFiles.length === 0) return;

    setIsImporting(true);
    const allResults: ImportResult[] = [];

    for (const file of validFiles) {
      try {
        const result = await importData(file.data, file.chosenType);
        allResults.push({ ...result, message: `${file.fileName}: ${result.message}` });
      } catch (error) {
        allResults.push({
          success: false,
          type: 'Error',
          count: 0,
          message: `${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    setResults(allResults);
    setScannedFiles([]);
    setIsImporting(false);

    // Signal to process media — track what types were imported so useEffect
    // can wait for the corresponding context data to be available
    if (pendingMediaFiles.length > 0) {
      const importedTypes = new Set(validFiles.map(f => f.chosenType));
      setImportedDataTypes(importedTypes);
      setShouldProcessMedia(true);
    }
  };

  const handleConfirmImport = async (useDetectedType: boolean) => {
    if (!pendingData) return;

    setIsImporting(true);
    setMismatchWarning(null);

    const typeToUse = useDetectedType && mismatchWarning ? mismatchWarning.detected : selectedType;

    if (useDetectedType && mismatchWarning) {
      setSelectedType(mismatchWarning.detected);
    }

    const result = await importData(pendingData, typeToUse);
    setResults([result]);
    setPendingData(null);
    setIsImporting(false);

    // Process pending media after import
    if (pendingMediaFiles.length > 0) {
      setImportedDataTypes(new Set([typeToUse]));
      setShouldProcessMedia(true);
    }
  };

  const handleCancelImport = () => {
    setMismatchWarning(null);
    setPendingData(null);
  };

  /**
   * Normalize a filename or word for flexible matching:
   *  - lowercase
   *  - replace underscores with spaces
   *  - strip variant suffix like "-1", "-2" at the end
   *  - strip accents (á→a, í→i, etc.)
   */
  const normalizeForMatch = (s: string): string => {
    return s
      .toLowerCase()
      .replace(/_/g, ' ')          // underscores → spaces
      .replace(/-\d+$/, '')        // strip variant suffix "-1", "-2"
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents
  };

  /** Find the best matching dictionary entry for a given audio basename */
  const findDictEntry = (basename: string) => {
    const norm = normalizeForMatch(basename);

    // 1. Exact match on dz
    let entry = entries.find(e => e.dz === basename);
    if (entry) return entry;

    // 2. Case-insensitive match
    entry = entries.find(e => e.dz.toLowerCase() === basename.toLowerCase());
    if (entry) return entry;

    // 3. Normalized match (underscores→spaces, strip accents, strip -N suffix)
    entry = entries.find(e => normalizeForMatch(e.dz) === norm);
    if (entry) return entry;

    // 4. Partial: strip variant suffix from basename and try again
    const withoutVariant = basename.replace(/-\d+$/, '');
    if (withoutVariant !== basename) {
      entry = entries.find(e => e.dz === withoutVariant || e.dz.toLowerCase() === withoutVariant.toLowerCase());
      if (entry) return entry;
      entry = entries.find(e => normalizeForMatch(e.dz) === normalizeForMatch(withoutVariant));
      if (entry) return entry;
    }

    return null;
  };

  // Detect what category a single media file belongs to based on extension, filename pattern, AND folder path
  const detectMediaCategory = (file: File): MediaCategory | null => {
    const name = file.name.toLowerCase();
    const isPng = name.endsWith('.png');
    const isAudio = ['.wav', '.mp3', '.m4a', '.aac'].some(ext => name.endsWith(ext));

    if (!isPng && !isAudio) return null;

    // Get the relative path from folder drop (set by getFilesFromDrop)
    const relPath = ((file as unknown as { relativePath?: string }).relativePath || '').toLowerCase();
    const pathParts = relPath.split('/').filter(Boolean);

    if (isAudio) {
      const basename = file.name.replace(/\.[^.]+$/, '');
      // Conversation audio pattern: {convId}_{number}_{A|B}
      if (/^(.+)_(\d+)_([AB])$/.test(basename)) return 'conv-audio';
      if (pathParts.some(p => p.includes('conversation'))) return 'conv-audio';
      return 'dict-audio';
    }

    if (isPng) {
      // 1. Check folder path for explicit hints
      if (pathParts.some(p => p === 'decks' || p === 'deck')) return 'deck-images';
      if (pathParts.some(p => p === 'culture' || p === 'cultures')) return 'culture-images';

      // 2. Try matching against any deck's card IDs or card image fields
      const basename = file.name.replace(/\.[^.]+$/, '');
      for (const dm of deckMetas) {
        const deck = loadDeckFromStorage(dm.id);
        if (deck && deck.getAllCards().some(c =>
          c.id === basename ||
          c.image === file.name ||
          c.image === basename ||
          c.image?.replace(/\.[^.]+$/, '') === basename
        )) {
          return 'deck-images';
        }
      }
      // Default images to culture
      return 'culture-images';
    }

    return null;
  };

  const processMediaFiles = async (files: File[], autoDetect: boolean = false) => {
    setIsProcessingMedia(true);
    setMediaResults([]);
    const results: typeof mediaResults = [];

    for (const file of files) {
      const category = autoDetect ? detectMediaCategory(file) : mediaCategory;

      if (!category) {
        results.push({ filename: file.name, matched: false, error: 'Unsupported file format' });
        continue;
      }

      const basename = file.name.replace(/\.[^.]+$/, '');

      switch (category) {
        case 'deck-images': {
          // Match card by id OR by image field (filename may match card.image, not card.id)
          // e.g. file "white-dog.png" → card.image="white-dog.png", card.id="animal-dog"
          const findCardInDeck = (deck: Deck) => {
            return deck.getAllCards().find(c =>
              c.id === basename ||
              c.image === file.name ||
              c.image === basename ||
              c.image?.replace(/\.[^.]+$/, '') === basename
            );
          };

          let targetDeckId = selectedDeckId;
          let matchedDeck: Deck | null = null;

          if (autoDetect) {
            for (const dm of deckMetas) {
              const deck = loadDeckFromStorage(dm.id);
              if (deck && findCardInDeck(deck)) {
                targetDeckId = dm.id;
                matchedDeck = deck;
                break;
              }
            }
          }

          if (!targetDeckId) {
            stageImage(`culture-${basename}`, basename, file, file.name);
            results.push({ filename: file.name, matched: true, matchedTo: 'Image (staged as culture, no deck selected)' });
            break;
          }
          const deck = matchedDeck || loadDeckFromStorage(targetDeckId);
          if (!deck) {
            results.push({ filename: file.name, matched: false, error: 'Deck not found in local data' });
            break;
          }
          const card = findCardInDeck(deck);
          if (card) {
            // Stage with card.id so editor lookup (getStagedForCard(card.id)) works
            stageImage(card.id, card.front || card.id, file, file.name, targetDeckId);
            results.push({ filename: file.name, matched: true, matchedTo: `Card: ${card.front || card.id} (${deck.title})` });
          } else {
            stageImage(basename, basename, file, file.name, targetDeckId);
            results.push({ filename: file.name, matched: true, matchedTo: `Deck image "${basename}" (staged, no matching card yet)` });
          }
          break;
        }

        case 'culture-images': {
          // Match image filename to culture deck image steps
          let matched = false;
          for (const deck of cultureDecks) {
            for (let si = 0; si < deck.steps.length; si++) {
              const step = deck.steps[si];
              if (step.type === 'image' && (step as { src?: string }).src === file.name) {
                const stepId = `culture-${deck.id}-step-${si}`;
                stageImage(stepId, file.name, file, file.name);
                results.push({ filename: file.name, matched: true, matchedTo: `Culture "${deck.title}" step ${si + 1}` });
                matched = true;
                break;
              }
            }
            if (matched) break;
          }
          if (!matched) {
            // No matching step found — stage with filename as key, will show in staging list
            stageImage(`culture-${basename}`, basename, file, file.name);
            results.push({ filename: file.name, matched: true, matchedTo: 'Culture image (staged, no matching step yet)' });
          }
          break;
        }

        case 'dict-audio': {
          const entry = findDictEntry(basename);
          if (entry) {
            await stageAudio(entry.dz, entry.dz, file, file.name, 'upload');
            results.push({ filename: file.name, matched: true, matchedTo: `Word: ${entry.dz} (${entry.en})` });
          } else {
            // Stage anyway — audio is still useful even without a matching entry yet
            await stageAudio(basename, basename, file, file.name, 'upload');
            results.push({ filename: file.name, matched: true, matchedTo: `Dict audio "${basename}" (staged, no matching entry yet)` });
          }
          break;
        }

        case 'conv-audio': {
          // Pattern: {convId}_{number}_{A|B} — convId may contain hyphens/underscores
          // Use greedy match for convId so "basic-greeting_1_A" → convId="basic-greeting"
          const match = basename.match(/^(.+)_(\d+)_([AB])$/);

          if (!match) {
            results.push({ filename: file.name, matched: false, error: 'Filename must match: {convId}_{number}_{A|B}' });
            break;
          }

          const [, convId, numStr, speaker] = match;

          // Try to find this conversation in loaded categories
          let foundCat: string | null = null;
          for (const cat of categories) {
            const conv = cat.conversations?.find((c: { id: string }) => c.id === convId);
            if (conv) {
              foundCat = cat.id;
              break;
            }
          }

          // Target path: assets/audio/conversations/{convId}/{originalFilename}
          // Matches skeleton app structure exactly
          const targetPath = `assets/audio/conversations/${convId}/${file.name}`;
          const exchangeIndex = parseInt(numStr) - 1;
          const stageId = `conv-${foundCat || 'unknown'}-${convId}-${exchangeIndex}`;
          await stageAudio(stageId, stageId, file, file.name, 'upload', targetPath);

          // Also update the exchange's audio field so it persists in JSON
          if (foundCat) {
            updateExchange(foundCat, convId, exchangeIndex, { audio: targetPath });
            results.push({ filename: file.name, matched: true, matchedTo: `${foundCat}/${convId}, exchange ${numStr}, speaker ${speaker}` });
          } else {
            results.push({ filename: file.name, matched: true, matchedTo: `Conv "${convId}" #${numStr} ${speaker} (staged, category not found yet — import conversations JSON first)` });
          }
          break;
        }
      }
    }

    setMediaResults(results);
    setIsProcessingMedia(false);
  };

  // Split files by extension and set up the right mode
  const processDroppedFiles = (allFiles: File[]) => {
    const supportedMediaExts = ['.png', '.wav', '.mp3', '.m4a', '.aac'];
    const isMedia = (f: File) => supportedMediaExts.some(ext => f.name.toLowerCase().endsWith(ext));

    const jsonFiles = allFiles.filter(f =>
      (f.type === 'application/json' || f.name.toLowerCase().endsWith('.json'))
      && !f.name.toLowerCase().endsWith('.schema.json')
    );
    const validMediaFiles = allFiles.filter(f => !f.name.toLowerCase().endsWith('.json') && isMedia(f));

    const hasJson = jsonFiles.length > 0;
    const hasMedia = validMediaFiles.length > 0;

    if (hasJson && hasMedia) {
      setMode('mixed');
    } else if (hasMedia) {
      setMode('media');
    } else {
      setMode('json');
    }

    if (hasMedia) {
      setPendingMediaFiles(validMediaFiles);
      setMediaResults([]);
    }

    if (hasJson) {
      if (jsonFiles.length === 1 && !hasMedia) {
        processFile(jsonFiles[0]);
      } else {
        scanJsonFiles(jsonFiles);
      }
    }

    // Media-only drop (no JSON): auto-process immediately with auto-detection
    // Data from previous imports is already in contexts (entries, categories, etc.)
    if (hasMedia && !hasJson) {
      processMediaFiles(validMediaFiles, true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    processDroppedFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Recursively read all files from dropped folders
    const files = await getFilesFromDrop(e);
    if (files.length > 0) {
      processDroppedFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const hasAnyResults = results.length > 0 || mediaResults.length > 0;
  const totalFilesDropped = scannedFiles.length + pendingMediaFiles.length;

  const resetAll = () => {
    setResults([]);
    setMediaResults([]);
    setScannedFiles([]);
    setPendingMediaFiles([]);
    setMismatchWarning(null);
    setPendingData(null);
    setMode('json');
    setIsProcessingMedia(false);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone — always visible unless importing */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all
          ${hasAnyResults || scannedFiles.length > 0 ? 'p-3' : 'p-6'}
          ${isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-hover-overlay)]'
          }
          ${isImporting ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json,image/png,.png,audio/*,.wav,.mp3,.m4a,.aac"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {isImporting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--color-text-muted)]">Importing...</span>
          </div>
        ) : hasAnyResults || scannedFiles.length > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium text-[var(--color-primary)]">
              Drop more files or click to browse
            </span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              Drop files or folders here
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              JSON + images + audio — auto-detected and imported
            </p>
          </>
        )}
      </div>

      {/* Mismatch Warning */}
      {mismatchWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
            Looks like <strong>{typeLabels[mismatchWarning.detected]}</strong> data (you selected {typeLabels[selectedType]})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirmImport(true)}
              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Import as {typeLabels[mismatchWarning.detected]}
            </button>
            <button
              onClick={() => handleConfirmImport(false)}
              className="py-1.5 px-3 bg-[var(--color-bg)] hover:bg-[var(--color-hover-overlay)] text-[var(--color-text)] text-xs rounded-lg border border-[var(--color-border)] transition-colors"
            >
              Use {typeLabels[selectedType]}
            </button>
            <button
              onClick={handleCancelImport}
              className="py-1.5 px-2 text-[var(--color-text-muted)] text-xs hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scanned JSON files — compact review */}
      {scannedFiles.length > 0 && !isImporting && results.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              {scannedFiles.length} JSON file{scannedFiles.length > 1 ? 's' : ''} detected
            </p>
            <button
              onClick={() => setScannedFiles([])}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="space-y-1">
            {scannedFiles.map((file, index) => {
              const isUnrecognized = file.detected === null;
              return (
                <div key={index} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                  isUnrecognized
                    ? 'bg-red-500/5 border border-red-500/20'
                    : 'bg-[var(--color-bg-secondary)]'
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    isUnrecognized ? 'bg-red-500/20' : 'bg-[var(--color-primary)]'
                  }`}>
                    <svg className={`w-3 h-3 ${isUnrecognized ? 'text-red-500' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isUnrecognized
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      }
                    </svg>
                  </div>
                  <span className="font-medium text-[var(--color-text)] truncate flex-1">{file.fileName}</span>
                  {!isUnrecognized && (
                    <select
                      value={file.chosenType}
                      onChange={(e) => changeScannedFileType(index, e.target.value as ImportType)}
                      className="text-[10px] bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded px-1 py-0.5 outline-none cursor-pointer"
                    >
                      <option value="dictionary">Dict</option>
                      <option value="conversations">Conv</option>
                      <option value="culture">Culture</option>
                      <option value="decks">Decks</option>
                    </select>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeScannedFile(index); }}
                    className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Primary action button — always visible when files are scanned */}
          {scannedFiles.some(f => f.data !== null) && (
            <button
              onClick={confirmImportScanned}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all shadow-sm"
            >
              Import {scannedFiles.filter(f => f.data !== null).length} file{scannedFiles.filter(f => f.data !== null).length > 1 ? 's' : ''}
              {pendingMediaFiles.length > 0 && ` + ${pendingMediaFiles.length} media`}
            </button>
          )}
        </div>
      )}

      {/* Pending media info (during mixed mode, before JSON import) */}
      {mode === 'mixed' && pendingMediaFiles.length > 0 && scannedFiles.length > 0 && results.length === 0 && (
        <p className="text-[10px] text-[var(--color-text-muted)] text-center">
          {pendingMediaFiles.length} media files will be auto-matched after JSON import
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                result.success
                  ? 'bg-emerald-500/10'
                  : 'bg-red-500/10'
              }`}
            >
              <svg className={`w-4 h-4 flex-shrink-0 ${result.success ? 'text-emerald-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {result.success
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                }
              </svg>
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${result.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.type}
                </span>
                <span className={`ml-1 ${result.success ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                  {result.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media processing — auto or manual */}
      {(mode === 'media' || mode === 'mixed') && pendingMediaFiles.length > 0 && mediaResults.length === 0 && !isProcessingMedia && results.length > 0 && (
        <button
          onClick={() => processMediaFiles(pendingMediaFiles, true)}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all shadow-sm"
        >
          Stage {pendingMediaFiles.length} Media Files
        </button>
      )}

      {/* Pure media mode — show category picker */}
      {mode === 'media' && pendingMediaFiles.length > 0 && mediaResults.length === 0 && !isProcessingMedia && results.length === 0 && scannedFiles.length === 0 && (
        <div className="space-y-3">
          <MediaInstructions
            category={mediaCategory}
            onCategoryChange={(cat) => {
              setMediaCategory(cat);
              setMediaResults([]);
            }}
            selectedDeckId={selectedDeckId}
            onDeckChange={setSelectedDeckId}
            decks={deckMetas.map(d => ({ id: d.id, title: d.title }))}
          />
          <button
            onClick={() => processMediaFiles(pendingMediaFiles, true)}
            disabled={mediaCategory === 'deck-images' && !selectedDeckId}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              mediaCategory === 'deck-images' && !selectedDeckId
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-white hover:opacity-90'
            }`}
          >
            Stage {pendingMediaFiles.length} Media Files
          </button>
        </div>
      )}

      {isProcessingMedia && (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--color-text-muted)]">Matching files...</span>
        </div>
      )}

      {/* Media results — compact summary */}
      {mediaResults.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                mediaResults.every(r => r.matched)
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                {mediaResults.filter(r => r.matched).length}/{mediaResults.length} staged
              </span>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar">
            {mediaResults.map((r, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                r.matched
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500'
              }`}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {r.matched
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  }
                </svg>
                <span className="font-mono truncate">{r.filename}</span>
                {r.matched && <span className="text-[var(--color-text-muted)] truncate">→ {r.matchedTo}</span>}
                {!r.matched && <span className="truncate">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset button — always accessible after any operation */}
      {hasAnyResults && (
        <button
          onClick={resetAll}
          className="w-full py-2 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-overlay)] border border-[var(--color-border)] transition-all"
        >
          Clear & Start Over
        </button>
      )}
    </div>
  );
}
