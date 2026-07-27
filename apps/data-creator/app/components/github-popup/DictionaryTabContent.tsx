'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useDictionary } from '../../contexts/DictionaryContext';
import { useAudioStaging } from '../../contexts/AudioStagingContext';
import { GitHubConfig, loadGitHubConfig, isConfigComplete, getFileSha, uploadFile } from '../../utils/githubApi';
import { getStoredLanguageCode } from '../../utils/language';
import { downloadEntriesAsCSV } from '../../utils/jsonGenerator';
import { Entry } from '../../models/Dictionary';
import AudioReviewDashboard from '../AudioReviewDashboard';

export default function DictionaryTabContent() {
  const { entries, toJSONString, clearEntries, importEntries, getEntryCount } = useDictionary();
  const { stagedFiles } = useAudioStaging();
  const toast = useToast();

  const [importText, setImportText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existsInfo, setExistsInfo] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [languageCode, setLanguageCode] = useState('dz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(loadGitHubConfig());
    setLanguageCode(getStoredLanguageCode());
  }, []);

  const count = getEntryCount();
  const configured = mounted && isConfigComplete(config);
  const path = `assets/dictionary/${languageCode}.dict.json`;

  const download = useCallback(() => {
    const blob = new Blob([toJSONString(languageCode)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${languageCode}.dict.json`;
    a.click();
  }, [toJSONString, languageCode]);

  const upload = useCallback(async () => {
    if (!configured) { toast.error('Configure GitHub first'); return; }
    setUploading(true);
    setExistsInfo(null);
    try {
      const sha = await getFileSha(config as GitHubConfig, path);
      if (sha) setExistsInfo(`${path} already exists on GitHub and will be updated.`);
      const result = await uploadFile(config as GitHubConfig, { path, content: toJSONString(languageCode) }, 'Update dictionary');
      if (result.success) {
        toast.success('Uploaded & local data cleared!');
        clearEntries();
      } else {
        toast.error(result.error || 'Failed');
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    setUploading(false);
  }, [toJSONString, languageCode, path, config, configured, toast]);

  const importData = useCallback(() => {
    if (!importText.trim()) { toast.warning('Paste JSON first'); return; }
    try {
      const parsed = JSON.parse(importText);
      const data = parsed.entries || (Array.isArray(parsed) ? parsed : []);
      if (!Array.isArray(data)) { toast.error('Invalid format'); return; }
      const newEntries = data.map((e: { dz: string; en: string; example?: string; exampleEn?: string; audio?: string }) =>
        new Entry(e.dz, e.en, e.example || '', e.exampleEn || '', e.audio || '')).filter((e: Entry) => e.isValid());
      const added = importEntries(newEntries);
      toast.success(`Imported ${added} entries`);
      setImportText('');
    } catch { toast.error('Invalid JSON'); }
  }, [importText, importEntries, toast]);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text)]">Dictionary</span>
        <span className="text-xs text-[var(--color-text-muted)]">{count} entries</span>
      </div>

      <Tabs defaultValue="export">
        <TabsList className="mb-2">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="audio">Audio {stagedFiles.length > 0 && `(${stagedFiles.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <div className="space-y-2">
            {configured && <p className="text-xs text-[var(--color-text-muted)]">Path: <code className="text-[var(--color-primary)]">{path}</code></p>}
            {existsInfo && <p className="text-xs text-[var(--color-warning)]">{existsInfo}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={download} disabled={count === 0}>Download</Button>
              <Button size="sm" onClick={upload} disabled={count === 0 || uploading || !configured}>{uploading ? '...' : 'Upload to GitHub'}</Button>
              <Button size="sm" variant="secondary" onClick={() => downloadEntriesAsCSV(entries)} disabled={count === 0}>CSV</Button>
            </div>
            {count > 0 && <Button size="sm" variant="ghost" onClick={() => confirm('Clear all?') && clearEntries()}>Clear All</Button>}
          </div>
        </TabsContent>

        <TabsContent value="import">
          <div className="space-y-2">
            <Input label="Paste JSON" multiline rows={4} value={importText} onChange={(e) => setImportText((e.target as HTMLTextAreaElement).value)} placeholder='{"entries": [...]}' />
            <Button size="sm" onClick={importData} disabled={!importText.trim()}>Import</Button>
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <AudioReviewDashboard audioFolder="audio/dictionary_words" onUploadComplete={(files) => toast.success(`Uploaded ${files.length} files`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
