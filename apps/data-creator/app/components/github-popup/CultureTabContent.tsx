'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useCulture } from '../../contexts/CultureContext';
import { useImageStaging } from '../../contexts/ImageStagingContext';
import { GitHubConfig, loadGitHubConfig, isConfigComplete, getFileSha, uploadFile, uploadBinaryFile } from '../../utils/githubApi';

export default function CultureTabContent() {
  const { decks, exportDeck, removeDeck, clearAll, stats } = useCulture();
  const { stagedFiles, markAsUploaded } = useImageStaging();
  const toast = useToast();

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(loadGitHubConfig());
  }, []);

  const configured = mounted && isConfigComplete(config);
  const images = stagedFiles.filter(i => i.targetFilename.includes('culture') || i.cardId.startsWith('culture-'));

  const downloadDeck = useCallback((deck: { id: string; title: string }) => {
    const content = exportDeck(deck.id);
    if (!content) { toast.error('Export failed'); return; }
    const blob = new Blob([content], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${deck.id}.json`;
    a.click();
  }, [exportDeck, toast]);

  const uploadDeck = useCallback(async (deck: { id: string; title: string }) => {
    if (!configured) { toast.error('Configure GitHub first'); return; }
    const content = exportDeck(deck.id);
    if (!content) { toast.error('Export failed'); return; }
    setUploadingId(deck.id);
    try {
      const sha = await getFileSha(config as GitHubConfig, `assets/culture/dz/${deck.id}.json`);
      if (sha) toast.warning(`${deck.title} already exists on GitHub — updating.`);
      const result = await uploadFile(config as GitHubConfig, { path: `assets/culture/dz/${deck.id}.json`, content }, `Update culture: ${deck.title}`);
      if (result.success) {
        toast.success(`Uploaded & removed: ${deck.title}`);
        removeDeck(deck.id);
      } else {
        toast.error(result.error || 'Failed');
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setUploadingId(null);
  }, [config, configured, exportDeck, toast]);

  const deleteDeck = useCallback((id: string) => {
    if (!confirm('Delete this culture deck?')) return;
    removeDeck(id);
    toast.success('Deleted');
  }, [removeDeck, toast]);

  const uploadImages = useCallback(async () => {
    if (!configured) { toast.error('Configure GitHub first'); return; }
    setUploadingImages(true);
    const ids: string[] = [];
    try {
      for (const img of images) {
        const result = await uploadBinaryFile(config as GitHubConfig, new File([img.blob], img.targetFilename, { type: img.blob.type }), `assets/images/culture/${img.targetFilename}`, `Add image`);
        if (result.success) ids.push(img.id);
      }
      markAsUploaded(ids);
      toast.success(`Uploaded ${ids.length} images`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setUploadingImages(false);
  }, [images, config, configured, markAsUploaded, toast]);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text)]">Culture</span>
        <span className="text-xs text-[var(--color-text-muted)]">{stats.decks} decks, {stats.steps} steps</span>
      </div>

      <Tabs defaultValue="decks">
        <TabsList className="mb-2">
          <TabsTrigger value="decks">Decks</TabsTrigger>
          <TabsTrigger value="images">Images {images.length > 0 && `(${images.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="decks">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {decks.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No culture decks</p>
            ) : (
              decks.map(deck => (
                <div key={deck.id} className="flex items-center gap-2 p-2 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{deck.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{deck.steps.length} steps</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => downloadDeck(deck)} title="Download">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => uploadDeck(deck)} disabled={!configured || uploadingId === deck.id} title="Upload">
                      {uploadingId === deck.id ? '...' : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteDeck(deck.id)} title="Delete">
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {configured && decks.length > 0 && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2">Path: <code className="text-[var(--color-primary)]">assets/culture/dz/[deck-id].json</code></p>
          )}
          {decks.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => confirm('Clear all culture decks?') && clearAll()} className="mt-2">Clear All</Button>
          )}
        </TabsContent>

        <TabsContent value="images">
          <div className="space-y-2">
            {images.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No images staged</p>
            ) : (
              <>
                <p className="text-xs text-[var(--color-text-muted)]">{images.length} images ready</p>
                <Button size="sm" onClick={uploadImages} disabled={uploadingImages || !configured}>{uploadingImages ? '...' : 'Upload Images to GitHub'}</Button>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
