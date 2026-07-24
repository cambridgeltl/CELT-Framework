'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { useToast } from '../ui/Toast';
import { useDictionary } from '../../contexts/DictionaryContext';
import { useConversations } from '../../contexts/ConversationsContext';
import { useCulture } from '../../contexts/CultureContext';
import { useDecks } from '../../contexts/DecksContext';
import { useAudioStaging } from '../../contexts/AudioStagingContext';
import { useImageStaging } from '../../contexts/ImageStagingContext';
import { Deck, Card as FlashCard } from '../../models/Deck';
import {
  GitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
  getFileSha,
  uploadFile,
  uploadJsonWithMerge,
  uploadBinaryFile,
  MergeStats,
} from '../../utils/githubApi';

type StepStatus = 'pending' | 'checking' | 'uploading' | 'done' | 'error' | 'skipped';

interface UploadStep {
  id: string;
  label: string;
  count: number;
  status: StepStatus;
  error?: string;
  existsOnGitHub?: boolean;
  mergeInfo?: string;  // Info about merge results
  skippedCount?: number;  // Number of skipped duplicates
}

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

const StatusIcon = ({ status }: { status: StepStatus }) => {
  if (status === 'done') return (
    <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
  if (status === 'error') return (
    <div className="w-6 h-6 rounded-full bg-[var(--color-danger)] flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
  if (status === 'checking') return (
    <div className="w-6 h-6 rounded-full border-2 border-[var(--color-info)] border-t-transparent animate-spin" />
  );
  if (status === 'uploading') return (
    <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
  );
  if (status === 'skipped') return (
    <div className="w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    </div>
  );
  return (
    <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)]" />
  );
};

export default function UploadAllTabContent() {
  const toast = useToast();
  const { entries, toJSONString: dictToJSON, clearEntries, getEntryCount } = useDictionary();
  const { categories, exportData: convExport, clearAll: convClearAll, stats: convStats } = useConversations();
  const { decks: cultureDecks, exportDeck: cultureExportDeck, clearAll: cultureClearAll, stats: cultureStats } = useCulture();
  const { decks: deckMetas, deleteDeck } = useDecks();
  const { stagedFiles: audioFiles, clearAllStaged: clearAudio } = useAudioStaging();
  const { stagedFiles: imageFiles, clearAllStaged: clearImages, markAsUploaded: markImagesUploaded } = useImageStaging();

  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<UploadStep[]>([]);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<Partial<{owner: string; repo: string; token: string}>>({});

  // Load decks and config from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const loadedDecks = deckMetas.map(m => loadDeckFromStorage(m.id)).filter((d): d is Deck => d !== null);
    setAllDecks(loadedDecks);
    setConfig(loadGitHubConfig());
  }, [deckMetas]);

  const configured = mounted && isConfigComplete(config);

  const dictCount = getEntryCount();
  const convAudio = audioFiles.filter(a => a.targetFilename.includes('conversations/'));
  const dictAudio = audioFiles.filter(a => !a.targetFilename.includes('conversations/'));
  const cultureImages = imageFiles.filter(i => i.targetFilename.includes('culture') || i.cardId.startsWith('culture-'));
  const deckImages = imageFiles.filter(i => !i.targetFilename.includes('culture') && !i.cardId.startsWith('culture-'));

  const totalItems = useMemo(() => {
    let count = 0;
    if (dictCount > 0) count++;
    if (categories.length > 0) count++;
    count += cultureDecks.length;
    count += allDecks.length;
    count += dictAudio.length + convAudio.length;
    count += cultureImages.length + deckImages.length;
    return count;
  }, [dictCount, categories, cultureDecks, allDecks, dictAudio, convAudio, cultureImages, deckImages]);

  const hasData = totalItems > 0;

  const updateStep = (id: string, update: Partial<UploadStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const handleUploadAll = useCallback(async () => {
    if (!configured || !hasData) return;
    if (!confirm('Upload all data to GitHub and clear local storage?')) return;

    setIsUploading(true);
    setIsDone(false);
    setProgress(0);

    const cfg = config as GitHubConfig;
    const newSteps: UploadStep[] = [];
    let stepsDone = 0;
    let totalSteps = 0;
    const errors: string[] = [];

    // Build step list
    if (dictCount > 0) {
      newSteps.push({ id: 'dict', label: 'Dictionary', count: dictCount, status: 'pending' });
      totalSteps++;
    }
    if (categories.length > 0) {
      newSteps.push({ id: 'conv', label: 'Conversations', count: convStats.conversations, status: 'pending' });
      totalSteps++;
    }
    if (cultureDecks.length > 0) {
      newSteps.push({ id: 'culture', label: 'Culture decks', count: cultureDecks.length, status: 'pending' });
      totalSteps++;
    }
    if (allDecks.length > 0) {
      newSteps.push({ id: 'decks', label: 'Flashcard decks', count: allDecks.length, status: 'pending' });
      totalSteps++;
    }
    if (dictAudio.length > 0) {
      newSteps.push({ id: 'dict-audio', label: 'Dictionary audio', count: dictAudio.length, status: 'pending' });
      totalSteps++;
    }
    if (convAudio.length > 0) {
      newSteps.push({ id: 'conv-audio', label: 'Conversation audio', count: convAudio.length, status: 'pending' });
      totalSteps++;
    }
    if (cultureImages.length > 0) {
      newSteps.push({ id: 'culture-img', label: 'Culture images', count: cultureImages.length, status: 'pending' });
      totalSteps++;
    }
    if (deckImages.length > 0) {
      newSteps.push({ id: 'deck-img', label: 'Deck images', count: deckImages.length, status: 'pending' });
      totalSteps++;
    }

    setSteps(newSteps);
    const advance = () => { stepsDone++; setProgress(Math.round((stepsDone / totalSteps) * 100)); };

    // Track skipped IDs for filtering audio uploads
    let skippedConversationIds: string[] = [];
    let skippedDictWords: string[] = [];

    // Helper: check if path exists, update step info, then upload
    const checkAndUpload = async (
      stepId: string,
      uploadFn: () => Promise<void>,
      paths: string[],
    ) => {
      // Check phase
      updateStep(stepId, { status: 'checking' });
      let anyExists = false;
      for (const p of paths) {
        const sha = await getFileSha(cfg, p);
        if (sha) { anyExists = true; break; }
      }
      if (anyExists) {
        updateStep(stepId, { existsOnGitHub: true });
      }
      // Upload phase
      updateStep(stepId, { status: 'uploading' });
      await uploadFn();
    };

    // 1. Dictionary JSON (merge with existing)
    if (dictCount > 0) {
      await checkAndUpload('dict', async () => {
        try {
          const r = await uploadJsonWithMerge(cfg, 'assets/dictionary/dictionary.dict.json', dictToJSON(), 'dictionary', 'Merge dictionary entries');
          if (r.success) {
            const stats = r.mergeStats;
            if (stats && stats.totalSkipped > 0) {
              skippedDictWords = stats.skippedIds;
              updateStep('dict', {
                status: 'done',
                mergeInfo: r.message,
                skippedCount: stats.totalSkipped
              });
            } else {
              updateStep('dict', { status: 'done', mergeInfo: r.message });
            }
          } else {
            updateStep('dict', { status: 'error', error: r.error });
            errors.push(`Dictionary: ${r.error}`);
          }
        } catch (e) { updateStep('dict', { status: 'error', error: String(e) }); errors.push(`Dictionary: ${e}`); }
      }, ['assets/dictionary/dictionary.dict.json']);
      advance();
    }

    // 2. Conversations JSON (merge with existing)
    if (categories.length > 0) {
      await checkAndUpload('conv', async () => {
        try {
          const r = await uploadJsonWithMerge(cfg, 'assets/conversations/conversations.json', convExport(), 'conversations', 'Merge conversations');
          if (r.success) {
            const stats = r.mergeStats;
            if (stats && stats.totalSkipped > 0) {
              skippedConversationIds = stats.skippedIds;
              updateStep('conv', {
                status: 'done',
                mergeInfo: r.message,
                skippedCount: stats.totalSkipped
              });
            } else {
              updateStep('conv', { status: 'done', mergeInfo: r.message });
            }
          } else {
            updateStep('conv', { status: 'error', error: r.error });
            errors.push(`Conversations: ${r.error}`);
          }
        } catch (e) { updateStep('conv', { status: 'error', error: String(e) }); errors.push(`Conversations: ${e}`); }
      }, ['assets/conversations/conversations.json']);
      advance();
    }

    // 3. Culture decks
    if (cultureDecks.length > 0) {
      const culturePaths = cultureDecks.map(d => `assets/culture/dz/${d.id}.json`);
      await checkAndUpload('culture', async () => {
        let cultureOk = true;
        for (const deck of cultureDecks) {
          const content = cultureExportDeck(deck.id);
          if (!content) continue;
          try {
            const r = await uploadFile(cfg, { path: `assets/culture/dz/${deck.id}.json`, content }, `Update culture: ${deck.title}`);
            if (!r.success) { cultureOk = false; errors.push(`Culture ${deck.title}: ${r.error}`); }
          } catch (e) { cultureOk = false; errors.push(`Culture ${deck.title}: ${e}`); }
        }
        updateStep('culture', { status: cultureOk ? 'done' : 'error' });
      }, culturePaths);
      advance();
    }

    // 4. Flashcard decks
    if (allDecks.length > 0) {
      const deckPaths = allDecks.map(d => `assets/decks/${d.id}.json`);
      await checkAndUpload('decks', async () => {
        let decksOk = true;
        for (const deck of allDecks) {
          try {
            const r = await uploadFile(cfg, { path: `assets/decks/${deck.id}.json`, content: deck.toJSONString() }, `Update deck: ${deck.title}`);
            if (!r.success) { decksOk = false; errors.push(`Deck ${deck.title}: ${r.error}`); }
          } catch (e) { decksOk = false; errors.push(`Deck ${deck.title}: ${e}`); }
        }
        updateStep('decks', { status: decksOk ? 'done' : 'error' });
      }, deckPaths);
      advance();
    }

    // 5. Dictionary audio (skip audio for duplicate words)
    if (dictAudio.length > 0) {
      // Filter out audio for skipped (duplicate) dictionary words
      const filteredDictAudio = dictAudio.filter(audio => {
        // wordDisplay contains the word - check if it was skipped
        return !skippedDictWords.includes(audio.wordDisplay);
      });

      const skippedAudioCount = dictAudio.length - filteredDictAudio.length;

      if (filteredDictAudio.length === 0 && skippedAudioCount > 0) {
        // All audio was for duplicate words
        updateStep('dict-audio', {
          status: 'skipped',
          mergeInfo: `All ${skippedAudioCount} audio files skipped (duplicate words)`
        });
        advance();
      } else {
        const audioPaths = filteredDictAudio.map(a => a.targetFilename.startsWith('assets/') ? a.targetFilename : `assets/audio/dictionary_words/${a.targetFilename}`);
        await checkAndUpload('dict-audio', async () => {
          let ok = true;
          for (const audio of filteredDictAudio) {
            const path = audio.targetFilename.startsWith('assets/') ? audio.targetFilename : `assets/audio/dictionary_words/${audio.targetFilename}`;
            try {
              const file = new File([audio.blob], audio.targetFilename.split('/').pop() || '', { type: audio.blob.type });
              const r = await uploadBinaryFile(cfg, file, path, `Add audio`);
              if (!r.success) { ok = false; errors.push(`Audio ${audio.wordDisplay}: ${r.error}`); }
            } catch (e) { ok = false; errors.push(`Audio: ${e}`); }
          }
          if (skippedAudioCount > 0) {
            updateStep('dict-audio', {
              status: ok ? 'done' : 'error',
              mergeInfo: `${skippedAudioCount} skipped (duplicate words)`
            });
          } else {
            updateStep('dict-audio', { status: ok ? 'done' : 'error' });
          }
        }, audioPaths);
        advance();
      }
    }

    // 6. Conversation audio (skip audio for duplicate conversations)
    if (convAudio.length > 0) {
      // Filter out audio for skipped (duplicate) conversations
      const filteredConvAudio = convAudio.filter(audio => {
        // Extract conversation ID from the audio path
        // Full path: assets/audio/conversations/{convId}/{filename}.wav
        // Or short: conversations/{convId}/{filename}.wav
        const pathParts = audio.targetFilename.split('/');
        const convIdx = pathParts.indexOf('conversations');
        if (convIdx >= 0 && convIdx + 1 < pathParts.length) {
          const convId = pathParts[convIdx + 1];
          return !skippedConversationIds.includes(convId);
        }
        return true;
      });

      const skippedAudioCount = convAudio.length - filteredConvAudio.length;

      if (filteredConvAudio.length === 0 && skippedAudioCount > 0) {
        // All audio was for duplicate conversations
        updateStep('conv-audio', {
          status: 'skipped',
          mergeInfo: `All ${skippedAudioCount} audio files skipped (duplicate conversations)`
        });
        advance();
      } else {
        const convAudioPaths = filteredConvAudio.map(a => a.targetFilename.startsWith('assets/') ? a.targetFilename : `assets/audio/conversations/${a.targetFilename}`);
        await checkAndUpload('conv-audio', async () => {
          let ok = true;
          for (const audio of filteredConvAudio) {
            const path = audio.targetFilename.startsWith('assets/') ? audio.targetFilename : `assets/audio/conversations/${audio.targetFilename}`;
            try {
              const file = new File([audio.blob], audio.targetFilename.split('/').pop() || '', { type: audio.blob.type });
              const r = await uploadBinaryFile(cfg, file, path, `Add audio`);
              if (!r.success) { ok = false; errors.push(`Conv audio: ${r.error}`); }
            } catch (e) { ok = false; errors.push(`Conv audio: ${e}`); }
          }
          if (skippedAudioCount > 0) {
            updateStep('conv-audio', {
              status: ok ? 'done' : 'error',
              mergeInfo: `${skippedAudioCount} skipped (duplicate conversations)`
            });
          } else {
            updateStep('conv-audio', { status: ok ? 'done' : 'error' });
          }
        }, convAudioPaths);
        advance();
      }
    }

    // 7. Culture images
    if (cultureImages.length > 0) {
      const imgPaths = cultureImages.map(i => `assets/images/culture/${i.targetFilename}`);
      await checkAndUpload('culture-img', async () => {
        let ok = true;
        const uploadedIds: string[] = [];
        for (const img of cultureImages) {
          try {
            const r = await uploadBinaryFile(cfg, new File([img.blob], img.targetFilename, { type: img.blob.type }), `assets/images/culture/${img.targetFilename}`, `Add image`);
            if (r.success) uploadedIds.push(img.id);
            else { ok = false; errors.push(`Image ${img.cardDisplay}: ${r.error}`); }
          } catch (e) { ok = false; errors.push(`Image: ${e}`); }
        }
        if (uploadedIds.length > 0) markImagesUploaded(uploadedIds);
        updateStep('culture-img', { status: ok ? 'done' : 'error' });
      }, imgPaths);
      advance();
    }

    // 8. Deck images
    if (deckImages.length > 0) {
      const deckImgPaths = deckImages.map(i => {
        const deckFolder = i.deckId ? `${i.deckId}/` : '';
        return `assets/images/decks/${deckFolder}${i.targetFilename}`;
      });
      await checkAndUpload('deck-img', async () => {
        let ok = true;
        const uploadedIds: string[] = [];
        for (const img of deckImages) {
          try {
            const deckFolder = img.deckId ? `${img.deckId}/` : '';
            const r = await uploadBinaryFile(cfg, new File([img.blob], img.targetFilename, { type: img.blob.type }), `assets/images/decks/${deckFolder}${img.targetFilename}`, `Add image`);
            if (r.success) uploadedIds.push(img.id);
            else { ok = false; errors.push(`Image ${img.cardDisplay}: ${r.error}`); }
          } catch (e) { ok = false; errors.push(`Image: ${e}`); }
        }
        if (uploadedIds.length > 0) markImagesUploaded(uploadedIds);
        updateStep('deck-img', { status: ok ? 'done' : 'error' });
      }, deckImgPaths);
      advance();
    }

    // Clear local data if no errors
    if (errors.length === 0) {
      if (dictCount > 0) clearEntries();
      if (categories.length > 0) convClearAll();
      if (cultureDecks.length > 0) cultureClearAll();
      allDecks.forEach(d => deleteDeck(d.id));
      clearAudio();
      clearImages();
      toast.success('All data uploaded and local data cleared!');
    } else {
      toast.warning(`Uploaded with ${errors.length} error(s). Local data kept.`);
    }

    setIsUploading(false);
    setIsDone(true);
  }, [
    configured, hasData, config, dictCount, dictToJSON, clearEntries,
    categories, convExport, convClearAll, convStats,
    cultureDecks, cultureExportDeck, cultureClearAll,
    allDecks, deleteDeck,
    dictAudio, convAudio, cultureImages, deckImages,
    clearAudio, clearImages, markImagesUploaded, toast,
  ]);

  return (
    <div className="space-y-4">
      {/* Data summary */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--color-text-muted)]">
            Data Summary
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
          {[
            { label: 'Dictionary', value: `${dictCount} entries`, active: dictCount > 0 },
            { label: 'Conversations', value: `${convStats.conversations} convs`, active: categories.length > 0 },
            { label: 'Culture', value: `${cultureStats.decks} decks`, active: cultureDecks.length > 0 },
            { label: 'Flashcards', value: `${allDecks.length} decks`, active: allDecks.length > 0 },
            { label: 'Audio', value: `${audioFiles.length} files`, active: audioFiles.length > 0 },
            { label: 'Images', value: `${imageFiles.length} files`, active: imageFiles.length > 0 },
          ].map(item => (
            <div key={item.label} className="bg-[var(--color-bg-secondary)] px-4 py-2.5">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className={`text-sm font-semibold ${item.active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload steps (shown during/after upload) */}
      {steps.length > 0 && (
        <div className="space-y-2 animate-slideDown">
          {isUploading && <Progress value={progress} variant="gradient" animated showLabel />}
          <div className="space-y-1.5">
            {steps.map(step => (
              <div key={step.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)]">
                <StatusIcon status={step.status} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.status === 'done' ? 'text-[var(--color-success)]' :
                    step.status === 'error' ? 'text-[var(--color-danger)]' :
                    step.status === 'uploading' ? 'text-[var(--color-primary)]' :
                    step.status === 'checking' ? 'text-[var(--color-info)]' :
                    step.status === 'skipped' ? 'text-[var(--color-text-muted)]' :
                    'text-[var(--color-text-muted)]'
                  }`}>
                    {step.label}
                    {step.status === 'checking' && <span className="text-xs font-normal ml-1.5">checking...</span>}
                  </p>
                  {/* Show merge info when available */}
                  {step.mergeInfo && step.status !== 'pending' && (
                    <p className={`text-xs ${
                      step.skippedCount && step.skippedCount > 0
                        ? 'text-[var(--color-warning)]'
                        : 'text-[var(--color-info)]'
                    }`}>
                      {step.mergeInfo}
                    </p>
                  )}
                  {/* Show exists info only if no merge info */}
                  {!step.mergeInfo && step.existsOnGitHub && step.status !== 'pending' && step.status !== 'done' && (
                    <p className="text-xs text-[var(--color-info)]">
                      {(step.id === 'dict' || step.id === 'conv')
                        ? 'Exists on GitHub — new entries will be merged'
                        : 'Already exists on GitHub — will be updated'
                      }
                    </p>
                  )}
                  {step.error && (
                    <p className="text-xs text-[var(--color-danger)] truncate">{step.error}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--color-text-muted)] tabular-nums">{step.count}</span>
                  {step.skippedCount !== undefined && step.skippedCount > 0 && (
                    <p className="text-xs text-[var(--color-warning)] tabular-nums">
                      -{step.skippedCount} dup
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result message */}
      {isDone && (() => {
        const allSuccess = steps.every(s => s.status === 'done' || s.status === 'skipped');
        const hasSkipped = steps.some(s => s.status === 'skipped');
        const totalSkipped = steps.reduce((acc, s) => acc + (s.skippedCount || 0), 0);

        return (
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border animate-slideDown
            ${allSuccess
              ? 'bg-[var(--color-success-light)] border-[var(--color-success)]'
              : 'bg-[var(--color-warning-light)] border-[var(--color-warning)]'
            }
          `}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              allSuccess ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'
            }`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {allSuccess
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                }
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                allSuccess ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'
              }`}>
                {allSuccess
                  ? 'Upload complete! Local storage cleared.'
                  : 'Completed with errors. Local data preserved.'
                }
              </p>
              {allSuccess && totalSkipped > 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  {totalSkipped} duplicate item{totalSkipped > 1 ? 's' : ''} skipped (already on GitHub)
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Action button */}
      <Button
        onClick={handleUploadAll}
        disabled={!configured || !hasData || isUploading}
        isLoading={isUploading}
        fullWidth
        size="sm"
      >
        {isUploading ? 'Uploading...' : isDone ? 'Upload Again' : 'Upload All & Clear Local Data'}
      </Button>

      {!configured && (
        <p className="text-xs text-[var(--color-warning)] text-center font-medium">
          Configure GitHub in settings first
        </p>
      )}
      {configured && !hasData && (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          No data to upload
        </p>
      )}
    </div>
  );
}
