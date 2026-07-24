'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import {
  GitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
  uploadFile,
  uploadJsonWithMerge,
  uploadBinaryFile,
  MergeStats,
} from '../../utils/githubApi';
import { useDecks } from '../../contexts/DecksContext';
import MediaInstructions, { MediaCategory, isValidMediaFile, getTargetPath } from './MediaInstructions';
import { getFilesFromDrop } from '../../utils/folderDrop';

type DataType = 'dictionary' | 'conversations' | 'culture' | 'decks';

interface UploadStep {
  id: string;
  label: string;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'skipped';
  message?: string;
  error?: string;
  mergeStats?: MergeStats;
}

// Detect what type of data the JSON contains (same logic as ImportTabContent)
function detectDataType(data: unknown): { detected: DataType | null; confidence: string } {
  if (!data || typeof data !== 'object') {
    return { detected: null, confidence: '' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.entries || obj.dictionary) {
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

  if (obj.decks) {
    const decks = obj.decks as unknown[];
    if (Array.isArray(decks) && decks.length > 0) {
      const first = decks[0] as Record<string, unknown>;
      if (first && first.cards) {
        const cards = first.cards as unknown[];
        if (Array.isArray(cards) && cards.length > 0) {
          const firstCard = cards[0] as Record<string, unknown>;
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

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if (first.dz !== undefined || first.en !== undefined || first.pos !== undefined) {
      return { detected: 'dictionary', confidence: 'Dictionary entries array' };
    }
    if (first.conversations !== undefined || first.lines !== undefined) {
      return { detected: 'conversations', confidence: 'Conversation categories array' };
    }
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
    const cleaned = text.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(cleaned);
  }
}

// Get item count from parsed data
function getItemCount(data: unknown, type: DataType): number {
  const obj = data as Record<string, unknown>;
  switch (type) {
    case 'dictionary': {
      if (obj.entries) return (obj.entries as unknown[]).length;
      if (obj.dictionary) return (obj.dictionary as unknown[]).length;
      if (Array.isArray(data)) return data.length;
      return 1;
    }
    case 'conversations': {
      if (obj.categories) {
        const cats = obj.categories as Record<string, unknown>[];
        return cats.reduce((sum, cat) => sum + ((cat.conversations as unknown[])?.length || 0), 0);
      }
      if (obj.conversations) return (obj.conversations as unknown[]).length;
      if (Array.isArray(data)) return data.length;
      return 1;
    }
    case 'culture': {
      if (obj.decks) return (obj.decks as unknown[]).length;
      if (obj.culture) return (obj.culture as unknown[]).length;
      if (Array.isArray(data)) return data.length;
      return 1; // Single deck
    }
    case 'decks': {
      if (obj.decks) return (obj.decks as unknown[]).length;
      if (Array.isArray(data)) return data.length;
      return 1; // Single deck
    }
  }
}

const typeLabels: Record<DataType, string> = {
  dictionary: 'Dictionary',
  conversations: 'Conversations',
  culture: 'Culture',
  decks: 'Decks',
};

const typeIcons: Record<DataType, string> = {
  dictionary: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  conversations: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  culture: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  decks: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
};

const typeColors: Record<DataType, string> = {
  dictionary: 'bg-blue-500',
  conversations: 'bg-violet-500',
  culture: 'bg-emerald-500',
  decks: 'bg-amber-500',
};

// Normalize data to the correct JSON structure for upload
function normalizeForUpload(data: unknown, type: DataType): { content: string; items: unknown[] } {
  const obj = data as Record<string, unknown>;

  switch (type) {
    case 'dictionary': {
      let entries: unknown[];
      if (obj.entries) entries = obj.entries as unknown[];
      else if (obj.dictionary) entries = obj.dictionary as unknown[];
      else if (Array.isArray(data)) entries = data;
      else entries = [data];
      const normalized = { entries };
      return { content: JSON.stringify(normalized, null, 2), items: entries };
    }
    case 'conversations': {
      let categories: unknown[];
      if (obj.categories) {
        categories = obj.categories as unknown[];
      } else if (obj.conversations) {
        categories = [{ id: 'imported', title: 'Imported', description: '', conversations: obj.conversations }];
      } else if (Array.isArray(data)) {
        categories = data;
      } else {
        categories = [data];
      }
      const normalized = { categories };
      return { content: JSON.stringify(normalized, null, 2), items: categories };
    }
    case 'culture': {
      let decks: unknown[];
      if (obj.decks) decks = obj.decks as unknown[];
      else if (obj.culture) decks = obj.culture as unknown[];
      else if (Array.isArray(data)) decks = data;
      else decks = [data];
      return { content: JSON.stringify({ decks }, null, 2), items: decks };
    }
    case 'decks': {
      let decks: unknown[];
      if (obj.decks) decks = obj.decks as unknown[];
      else if (Array.isArray(data)) decks = data;
      else decks = [data];
      return { content: JSON.stringify({ decks }, null, 2), items: decks };
    }
  }
}

const StatusIcon = ({ status }: { status: UploadStep['status'] }) => {
  if (status === 'done') return (
    <div className="w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
  if (status === 'error') return (
    <div className="w-5 h-5 rounded-full bg-[var(--color-danger)] flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
  if (status === 'uploading') return (
    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
  );
  if (status === 'skipped') return (
    <div className="w-5 h-5 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
      <svg className="w-3 h-3 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    </div>
  );
  return <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)]" />;
};

export default function BulkUploadTabContent() {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<Array<{
    fileName: string;
    data: unknown;
    type: DataType;
    confidence: string;
    itemCount: number;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<UploadStep[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<{ owner: string; repo: string; token: string }>>({});
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { decks: deckMetas } = useDecks();
  const [mode, setMode] = useState<'json' | 'media' | 'mixed'>('json');
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>('deck-images');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    setMounted(true);
    setConfig(loadGitHubConfig());
  }, []);

  const configured = mounted && isConfigComplete(config);

  // Auto-detect media category from filename pattern, extension, AND folder path
  const detectFileCategory = (file: File): MediaCategory | null => {
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
      // Also check folder path for "conversation" hint
      if (pathParts.some(p => p.includes('conversation'))) return 'conv-audio';
      return 'dict-audio';
    }

    // PNG — use folder path to distinguish deck images from culture images
    if (isPng) {
      // Check folder structure for clues
      if (pathParts.some(p => p === 'decks' || p === 'deck')) return 'deck-images';
      if (pathParts.some(p => p === 'culture' || p === 'cultures')) return 'culture-images';
      // Also check if any JSON was detected as deck data — if we have deck JSON + images, likely deck images
      if (parsedFiles.some(f => f.type === 'decks') && !parsedFiles.some(f => f.type === 'culture')) return 'deck-images';
      if (parsedFiles.some(f => f.type === 'culture') && !parsedFiles.some(f => f.type === 'decks')) return 'culture-images';
      // Default: if we can find a matching deck for this image, it's a deck image
      return 'deck-images';
    }

    return null;
  };

  const processFilesFromArray = (allFiles: File[]) => {
    setParseError(null);
    setParsedFiles([]);
    setSteps([]);
    setIsDone(false);
    setMediaFiles([]);

    const supportedMediaExts = ['.png', '.wav', '.mp3', '.m4a', '.aac'];
    const isMedia = (f: File) => supportedMediaExts.some(ext => f.name.toLowerCase().endsWith(ext));
    const jsonFiles = allFiles.filter(f =>
      (f.type === 'application/json' || f.name.toLowerCase().endsWith('.json'))
      && !f.name.toLowerCase().endsWith('.schema.json')
    );
    const validMediaFiles = allFiles.filter(f =>
      !f.name.toLowerCase().endsWith('.json') && isMedia(f)
    );

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
      setMediaFiles(validMediaFiles);
      const hasImages = validMediaFiles.some(f => f.name.toLowerCase().endsWith('.png'));
      const hasAudio = validMediaFiles.some(f =>
        ['.wav', '.mp3', '.m4a', '.aac'].some(ext => f.name.toLowerCase().endsWith(ext))
      );
      if (hasImages && !hasAudio) {
        setMediaCategory('deck-images');
      } else if (hasAudio && !hasImages) {
        setMediaCategory('dict-audio');
      }
    }

    if (!hasJson && !hasMedia) {
      setParseError('No supported files found. Please select .json, .png, or audio files.');
      return;
    }

    if (!hasJson) return;

    const results: typeof parsedFiles = [];
    let processed = 0;

    jsonFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        processed++;
        try {
          const data = lenientJsonParse(reader.result as string);
          const { detected, confidence } = detectDataType(data);

          if (detected) {
            results.push({
              fileName: file.name,
              data,
              type: detected,
              confidence,
              itemCount: getItemCount(data, detected),
            });
          } else {
            results.push({
              fileName: file.name,
              data,
              type: 'dictionary',
              confidence: 'Unknown format (defaulting to Dictionary)',
              itemCount: 0,
            });
          }
        } catch (e) {
          setParseError(`Failed to parse ${file.name}: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
        }

        if (processed === jsonFiles.length) {
          setParsedFiles(results);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesFromArray(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Recursively read all files from dropped folders
    const files = await getFilesFromDrop(e);
    if (files.length > 0) {
      processFilesFromArray(files);
    }
  };

  const removeFile = (index: number) => {
    setParsedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const changeFileType = (index: number, newType: DataType) => {
    setParsedFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, type: newType, itemCount: getItemCount(f.data, newType) } : f
    ));
  };

  const handleBulkUpload = async () => {
    if (!configured || parsedFiles.length === 0) return;

    setIsUploading(true);
    setIsDone(false);
    setProgress(0);

    const cfg = config as GitHubConfig;
    const newSteps: UploadStep[] = parsedFiles.map((f, i) => ({
      id: `file-${i}`,
      label: `${f.fileName} (${typeLabels[f.type]})`,
      status: 'pending' as const,
    }));
    setSteps(newSteps);

    const updateStep = (id: string, update: Partial<UploadStep>) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
    };

    let completed = 0;

    for (let i = 0; i < parsedFiles.length; i++) {
      const file = parsedFiles[i];
      const stepId = `file-${i}`;
      updateStep(stepId, { status: 'uploading' });

      try {
        const { content, items } = normalizeForUpload(file.data, file.type);

        switch (file.type) {
          case 'dictionary': {
            const r = await uploadJsonWithMerge(
              cfg,
              'assets/dictionary/dictionary.dict.json',
              content,
              'dictionary',
              `Bulk upload dictionary from ${file.fileName}`
            );
            if (r.success) {
              updateStep(stepId, {
                status: 'done',
                message: r.message,
                mergeStats: r.mergeStats,
              });
            } else {
              updateStep(stepId, { status: 'error', error: r.error });
            }
            break;
          }

          case 'conversations': {
            const r = await uploadJsonWithMerge(
              cfg,
              'assets/conversations/conversations.json',
              content,
              'conversations',
              `Bulk upload conversations from ${file.fileName}`
            );
            if (r.success) {
              updateStep(stepId, {
                status: 'done',
                message: r.message,
                mergeStats: r.mergeStats,
              });
            } else {
              updateStep(stepId, { status: 'error', error: r.error });
            }
            break;
          }

          case 'culture': {
            const decks = items as Record<string, unknown>[];
            let allOk = true;
            const messages: string[] = [];

            for (const deck of decks) {
              const deckId = (deck.id as string) || `culture-${Date.now()}`;
              const deckTitle = (deck.title as string) || 'Untitled';
              const r = await uploadFile(
                cfg,
                { path: `assets/culture/dz/${deckId}.json`, content: JSON.stringify(deck, null, 2) },
                `Bulk upload culture: ${deckTitle}`
              );
              if (r.success) {
                messages.push(`${deckTitle}: uploaded`);
              } else {
                allOk = false;
                messages.push(`${deckTitle}: ${r.error}`);
              }
            }

            updateStep(stepId, {
              status: allOk ? 'done' : 'error',
              message: `${decks.length} deck(s) processed`,
              error: allOk ? undefined : messages.filter(m => m.includes(':')).join('; '),
            });
            break;
          }

          case 'decks': {
            const decks = items as Record<string, unknown>[];
            let allOk = true;
            const messages: string[] = [];

            for (const deck of decks) {
              const deckId = (deck.id as string) || `deck-${Date.now()}`;
              const deckTitle = (deck.title as string) || 'Untitled';
              const r = await uploadFile(
                cfg,
                { path: `assets/decks/${deckId}.json`, content: JSON.stringify(deck, null, 2) },
                `Bulk upload deck: ${deckTitle}`
              );
              if (r.success) {
                messages.push(`${deckTitle}: uploaded`);
              } else {
                allOk = false;
                messages.push(`${deckTitle}: ${r.error}`);
              }
            }

            updateStep(stepId, {
              status: allOk ? 'done' : 'error',
              message: `${decks.length} deck(s) processed`,
              error: allOk ? undefined : messages.filter(m => m.includes(':')).join('; '),
            });
            break;
          }
        }
      } catch (e) {
        updateStep(stepId, {
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }

      completed++;
      setProgress(Math.round((completed / parsedFiles.length) * 100));
    }

    setIsUploading(false);
    setIsDone(true);
  };

  /**
   * Extract deckId from a file's relative path.
   * e.g., "mydata/decks/animals/white-dog.png" → "animals"
   * Falls back to selectedDeckId or 'unknown'.
   */
  const extractDeckIdFromPath = (file: File): string => {
    const relPath = (file as unknown as { relativePath?: string }).relativePath || '';
    const parts = relPath.split('/').filter(Boolean);
    // The deckId is the folder directly containing the image file
    // e.g., parts = ["mydata", "decks", "animals", "white-dog.png"] → "animals"
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // parent folder of the file
    }
    return selectedDeckId || 'unknown';
  };

  /**
   * Build the correct target path for a media file, using folder structure
   * to determine deckId/convId when available.
   */
  const buildTargetPath = (file: File, category: MediaCategory): string => {
    const relPath = (file as unknown as { relativePath?: string }).relativePath || '';
    const parts = relPath.split('/').filter(Boolean);

    switch (category) {
      case 'deck-images': {
        const deckId = extractDeckIdFromPath(file);
        return `assets/images/decks/${deckId}/${file.name}`;
      }
      case 'culture-images':
        return `assets/images/culture/${file.name}`;
      case 'dict-audio':
        return `assets/audio/dictionary_words/${file.name}`;
      case 'conv-audio': {
        const basename = file.name.replace(/\.[^.]+$/, '');
        const match = basename.match(/^(.+)_(\d+)_([AB])$/);
        if (match) {
          return `assets/audio/conversations/${match[1]}/${file.name}`;
        }
        // Try to get convId from folder path
        if (parts.length >= 2) {
          const parentFolder = parts[parts.length - 2];
          return `assets/audio/conversations/${parentFolder}/${file.name}`;
        }
        return `assets/audio/conversations/unknown/${file.name}`;
      }
    }
  };

  const handleMediaUpload = async () => {
    if (!configured || mediaFiles.length === 0) return;
    const autoDetect = mode === 'mixed';

    if (!autoDetect && mediaCategory === 'deck-images' && !selectedDeckId) {
      setParseError('Please select a target deck first.');
      return;
    }

    setIsUploading(true);
    setIsDone(false);
    setProgress(0);

    const cfg = config as GitHubConfig;

    // In mixed mode, auto-detect each file's category by filename pattern + folder path
    // In manual mode, use the user-selected category
    const categorizedFiles: Array<{ file: File; category: MediaCategory | null }> = mediaFiles.map(f => ({
      file: f,
      category: autoDetect ? detectFileCategory(f) : (isValidMediaFile(f, mediaCategory) ? mediaCategory : null),
    }));

    const validFiles = categorizedFiles.filter(cf => cf.category !== null);
    const invalidFiles = categorizedFiles.filter(cf => cf.category === null);

    const newSteps: UploadStep[] = [
      ...validFiles.map((cf, i) => ({
        id: `media-${i}`,
        label: `${cf.file.name}${autoDetect ? ` [${cf.category}]` : ''}`,
        status: 'pending' as const,
      })),
      ...invalidFiles.map((cf, i) => ({
        id: `invalid-${i}`,
        label: cf.file.name,
        status: 'skipped' as const,
        message: 'Unsupported file format — skipped',
      })),
    ];
    setSteps(newSteps);

    let completed = 0;
    const updateStep = (id: string, update: Partial<UploadStep>) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
    };

    for (let i = 0; i < validFiles.length; i++) {
      const { file, category } = validFiles[i];
      const stepId = `media-${i}`;
      updateStep(stepId, { status: 'uploading' });

      try {
        // Use buildTargetPath which extracts deckId/convId from folder structure
        const targetPath = autoDetect
          ? buildTargetPath(file, category!)
          : getTargetPath(file, category!, selectedDeckId);
        const r = await uploadBinaryFile(cfg, file, targetPath, `Add media: ${file.name}`);
        if (r.success) {
          updateStep(stepId, { status: 'done', message: targetPath });
        } else {
          updateStep(stepId, { status: 'error', error: r.error || 'Upload failed' });
        }
      } catch (e) {
        updateStep(stepId, { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' });
      }

      completed++;
      setProgress(Math.round((completed / validFiles.length) * 100));
    }

    setIsUploading(false);
    setIsDone(true);
  };

  const reset = () => {
    setParsedFiles([]);
    setSteps([]);
    setIsDone(false);
    setProgress(0);
    setParseError(null);
    setMediaFiles([]);
    setMode('json');
  };

  const hasFiles = parsedFiles.length > 0 || mediaFiles.length > 0;
  const totalFiles = parsedFiles.length + mediaFiles.length;

  // Combined upload: push JSON first, then media
  const handlePushAll = async () => {
    if (!configured) return;
    if (parsedFiles.length > 0) {
      await handleBulkUpload();
    }
    if (mediaFiles.length > 0) {
      await handleMediaUpload();
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone — always visible, compact when files are loaded */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all
          ${hasFiles || isDone ? 'p-3' : 'p-6'}
          ${isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-hover-overlay)]'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json,image/png,.png,audio/*,.wav,.mp3,.m4a,.aac"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        {hasFiles || isDone ? (
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
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              Drop files or folders to push to GitHub
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Auto-detects type, merges with existing data
            </p>
          </>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-xs text-red-600 dark:text-red-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {parseError}
        </div>
      )}

      {/* File summary — compact list of all detected files */}
      {hasFiles && !isUploading && !isDone && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              {totalFiles} file{totalFiles > 1 ? 's' : ''} ready
            </p>
            <button
              onClick={reset}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            >
              Clear
            </button>
          </div>

          {/* JSON files */}
          {parsedFiles.length > 0 && (
            <div className="space-y-1">
              {parsedFiles.map((file, index) => (
                <div key={`json-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-bg-secondary)] text-xs">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${typeColors[file.type]}`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[file.type]} />
                    </svg>
                  </div>
                  <span className="font-medium text-[var(--color-text)] truncate flex-1">{file.fileName}</span>
                  <select
                    value={file.type}
                    onChange={(e) => changeFileType(index, e.target.value as DataType)}
                    className="text-[10px] bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded px-1 py-0.5 outline-none cursor-pointer"
                  >
                    <option value="dictionary">Dict</option>
                    <option value="conversations">Conv</option>
                    <option value="culture">Culture</option>
                    <option value="decks">Decks</option>
                  </select>
                  <span className="text-[var(--color-text-muted)]">{file.itemCount} items</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media files — show summary, not individual files */}
          {mediaFiles.length > 0 && (
            <div className="space-y-1">
              {mode === 'media' && (
                <MediaInstructions
                  category={mediaCategory}
                  onCategoryChange={(cat) => { setMediaCategory(cat); setSteps([]); }}
                  selectedDeckId={selectedDeckId}
                  onDeckChange={setSelectedDeckId}
                  decks={deckMetas.map(d => ({ id: d.id, title: d.title }))}
                />
              )}

              {(() => {
                const pngCount = mediaFiles.filter(f => f.name.toLowerCase().endsWith('.png')).length;
                const audioCount = mediaFiles.filter(f => ['.wav', '.mp3', '.m4a', '.aac'].some(ext => f.name.toLowerCase().endsWith(ext))).length;
                const parts: string[] = [];
                if (pngCount > 0) parts.push(`${pngCount} image${pngCount > 1 ? 's' : ''}`);
                if (audioCount > 0) parts.push(`${audioCount} audio`);

                return (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-bg-secondary)] text-xs">
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-[var(--color-primary)]">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-[var(--color-text)] flex-1">{parts.join(' + ')}</span>
                    <span className="text-[var(--color-text-muted)]">
                      {mode === 'mixed' ? 'auto-detect' : mediaCategory.replace('-', ' ')}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {steps.length > 0 && (
        <div className="space-y-2 animate-slideDown">
          {isUploading && <Progress value={progress} variant="gradient" animated showLabel />}
          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
            {steps.map(step => (
              <div key={step.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] text-xs">
                <StatusIcon status={step.status} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    step.status === 'done' ? 'text-[var(--color-success)]' :
                    step.status === 'error' ? 'text-[var(--color-danger)]' :
                    step.status === 'uploading' ? 'text-[var(--color-primary)]' :
                    'text-[var(--color-text-muted)]'
                  }`}>
                    {step.label}
                  </p>
                  {step.mergeStats && step.mergeStats.totalSkipped > 0 && (
                    <p className="text-[var(--color-warning)]">
                      {step.mergeStats.totalSkipped} duplicate{step.mergeStats.totalSkipped > 1 ? 's' : ''} skipped
                    </p>
                  )}
                  {step.error && (
                    <p className="text-[var(--color-danger)] truncate">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done message */}
      {isDone && (() => {
        const doneSteps = steps.filter(s => s.status === 'done').length;
        const errorSteps = steps.filter(s => s.status === 'error').length;
        const allSuccess = errorSteps === 0;
        return (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
            allSuccess
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <svg className={`w-4 h-4 flex-shrink-0 ${allSuccess ? 'text-emerald-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {allSuccess
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              }
            </svg>
            <p className={`text-xs font-medium ${allSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {allSuccess ? `${doneSteps} file${doneSteps > 1 ? 's' : ''} pushed!` : `${doneSteps} pushed, ${errorSteps} failed`}
            </p>
          </div>
        );
      })()}

      {/* Single push button — combines JSON + media */}
      {hasFiles && !isDone && !isUploading && (
        <button
          onClick={handlePushAll}
          disabled={!configured || (mode === 'media' && mediaCategory === 'deck-images' && !selectedDeckId)}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            !configured || (mode === 'media' && mediaCategory === 'deck-images' && !selectedDeckId)
              ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 text-white hover:opacity-90'
          }`}
        >
          Push {totalFiles} file{totalFiles > 1 ? 's' : ''} to GitHub
        </button>
      )}

      {isUploading && (
        <div className="text-center">
          <span className="text-xs text-[var(--color-text-muted)]">Pushing to GitHub...</span>
        </div>
      )}

      {isDone && (
        <button
          onClick={reset}
          className="w-full py-2 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-overlay)] border border-[var(--color-border)] transition-all"
        >
          Clear & Upload More
        </button>
      )}

      {!configured && !isUploading && (
        <p className="text-xs text-[var(--color-warning)] text-center font-medium">
          Configure GitHub in settings first
        </p>
      )}
    </div>
  );
}
