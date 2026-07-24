'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Progress } from '../ui/Progress';
import { useToast } from '../ui/Toast';
import {
  GitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
  getFileSha,
  uploadBinaryFile,
  uploadFile,
} from '../../utils/githubApi';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const FOLDERS = ['dictionary', 'conversations', 'culture/dz', 'audio/conversations', 'audio/dictionary_words', 'images', 'decks'] as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FilesTabContent() {
  const toast = useToast();
  const [folder, setFolder] = useState<string>(FOLDERS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setConfig(loadGitHubConfig());
  }, []);

  const configComplete = mounted && isConfigComplete(config);
  const path = `assets/${folder}/${fileName || 'filename'}`;

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setFileName(f.name);
    setStatus('idle');
  }, []);

  const handleUpload = async () => {
    if (!file || !configComplete || !fileName) {
      toast.error('Configure GitHub and select a file');
      return;
    }

    setStatus('uploading');
    setProgress(0);

    try {
      const uploadPath = `assets/${folder}/${fileName}`;

      // Check if file already exists on GitHub
      const existingSha = await getFileSha(config as GitHubConfig, uploadPath);
      if (existingSha) {
        setStatus('error');
        toast.error(`File "${fileName}" already exists at assets/${folder}/${fileName} on GitHub. Rename the file or remove it from the repo first.`);
        return;
      }

      const interval = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 150);

      const isBinary = !file.type.startsWith('text/') &&
        !file.name.match(/\.(json|txt|csv)$/);

      const result = isBinary
        ? await uploadBinaryFile(config as GitHubConfig, file, uploadPath, `Upload: ${fileName}`)
        : await uploadFile(config as GitHubConfig, { path: uploadPath, content: await file.text() }, `Upload: ${fileName}`);

      clearInterval(interval);

      if (result.success) {
        setProgress(100);
        setStatus('success');
        toast.success('Uploaded!');
        setTimeout(() => { setFile(null); setFileName(''); setStatus('idle'); setProgress(0); }, 2000);
      } else {
        setStatus('error');
        toast.error(result.error || 'Failed');
      }
    } catch (e) {
      setStatus('error');
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <div className="space-y-3">
      {/* Folder selector */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block tracking-wide">
          Destination Folder
        </label>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="
            w-full px-3 py-2 text-sm rounded-lg
            border border-[var(--color-border)]
            bg-[var(--color-bg)] text-[var(--color-text)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
          "
        >
          {FOLDERS.map(f => (
            <option key={f} value={f}>assets/{f}/</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        className={`
          rounded-xl p-5 text-center cursor-pointer
          border-2 border-dashed transition-all duration-300
          ${isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] scale-[1.01]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/50'
          }
          ${!configComplete ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--color-text)]">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.size)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <svg className="w-7 h-7 mx-auto text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-[var(--color-text-muted)]">
              Drop file or <span className="text-[var(--color-primary)] font-medium">browse</span>
            </p>
          </div>
        )}
      </div>

      {/* Filename & Path */}
      {file && (
        <div className="space-y-2 animate-slideDown">
          <Input
            label="Filename"
            value={fileName}
            onChange={(e) => setFileName((e.target as HTMLInputElement).value)}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Path: <code className="text-[var(--color-primary)] font-medium px-1.5 py-0.5 rounded bg-[var(--color-primary-light)]">{path}</code>
          </p>
        </div>
      )}

      {/* Progress */}
      {status === 'uploading' && (
        <div className="animate-fadeIn">
          <Progress value={progress} variant="gradient" animated />
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || !configComplete || status === 'uploading' || !fileName}
        isLoading={status === 'uploading'}
        fullWidth
        size="sm"
      >
        Upload to GitHub
      </Button>

      {!configComplete && (
        <p className="text-xs text-[var(--color-warning)] text-center font-medium">
          Configure GitHub in settings
        </p>
      )}
    </div>
  );
}
