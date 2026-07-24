'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useConversations } from '../../contexts/ConversationsContext';
import { useAudioStaging } from '../../contexts/AudioStagingContext';
import { GitHubConfig, loadGitHubConfig, isConfigComplete, getFileSha, uploadFile, uploadBinaryFile } from '../../utils/githubApi';

export default function ConversationsTabContent() {
  const { categories, exportData, importData, clearAll, stats } = useConversations();
  const { stagedFiles, markAsUploaded } = useAudioStaging();
  const toast = useToast();

  const [importText, setImportText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [existsInfo, setExistsInfo] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(loadGitHubConfig());
  }, []);

  const configured = mounted && isConfigComplete(config);
  const audioFiles = stagedFiles.filter(a => a.targetFilename.includes('conversations/'));

  const download = useCallback(() => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'conversations.json';
    a.click();
  }, [exportData]);

  const upload = useCallback(async () => {
    if (!configured) { toast.error('Configure GitHub first'); return; }
    setUploading(true);
    setExistsInfo(null);
    try {
      const sha = await getFileSha(config as GitHubConfig, 'assets/conversations/conversations.json');
      if (sha) setExistsInfo('conversations.json already exists on GitHub and will be updated.');
      const result = await uploadFile(config as GitHubConfig, { path: 'assets/conversations/conversations.json', content: exportData() }, 'Update conversations');
      if (result.success) {
        toast.success('Uploaded & local data cleared!');
        clearAll();
      } else {
        toast.error(result.error || 'Failed');
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setUploading(false);
  }, [exportData, config, configured, toast]);

  const handleImport = useCallback(() => {
    if (!importText.trim()) { toast.warning('Paste JSON first'); return; }
    const result = importData(importText);
    result.success ? (toast.success(result.message), setImportText('')) : toast.error(result.message);
  }, [importText, importData, toast]);

  const uploadAudio = useCallback(async () => {
    if (!configured) { toast.error('Configure GitHub first'); return; }
    setUploadingAudio(true);
    const ids: string[] = [];
    try {
      for (const audio of audioFiles) {
        const path = audio.targetFilename.startsWith('assets/') ? audio.targetFilename : `assets/audio/conversations/${audio.targetFilename}`;
        const result = await uploadBinaryFile(config as GitHubConfig, new File([audio.blob], audio.targetFilename.split('/').pop() || '', { type: audio.blob.type }), path, `Add audio`);
        if (result.success) ids.push(audio.id);
      }
      markAsUploaded(ids);
      toast.success(`Uploaded ${ids.length} audio files & cleared`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setUploadingAudio(false);
  }, [audioFiles, config, configured, markAsUploaded, toast]);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text)]">Conversations</span>
        <span className="text-xs text-[var(--color-text-muted)]">{stats.categories} cat, {stats.conversations} conv</span>
      </div>

      <Tabs defaultValue="export">
        <TabsList className="mb-2">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="audio">Audio {audioFiles.length > 0 && `(${audioFiles.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <div className="space-y-2">
            {configured && <p className="text-xs text-[var(--color-text-muted)]">Path: <code className="text-[var(--color-primary)]">assets/conversations/conversations.json</code></p>}
            {existsInfo && <p className="text-xs text-[var(--color-warning)]">{existsInfo}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={download} disabled={categories.length === 0}>Download</Button>
              <Button size="sm" onClick={upload} disabled={categories.length === 0 || uploading || !configured}>{uploading ? '...' : 'Upload to GitHub'}</Button>
            </div>
            {categories.length > 0 && <Button size="sm" variant="ghost" onClick={() => confirm('Clear all?') && clearAll()}>Clear All</Button>}
          </div>
        </TabsContent>

        <TabsContent value="import">
          <div className="space-y-2">
            <Input label="Paste JSON" multiline rows={4} value={importText} onChange={(e) => setImportText((e.target as HTMLTextAreaElement).value)} placeholder='{"categories": [...]}' />
            <Button size="sm" onClick={handleImport} disabled={!importText.trim()}>Import</Button>
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="space-y-2">
            {audioFiles.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No audio staged</p>
            ) : (
              <>
                <p className="text-xs text-[var(--color-text-muted)]">{audioFiles.length} files ready</p>
                <Button size="sm" onClick={uploadAudio} disabled={uploadingAudio || !configured}>{uploadingAudio ? '...' : 'Upload Audio to GitHub'}</Button>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
