'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardBody } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import {
  GitHubConfig,
  saveGitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
  getFileSha,
  uploadBinaryFile,
  uploadFile,
} from '../utils/githubApi';

interface EnhancedGitHubUploaderProps {
  folderName: string;
  acceptedTypes?: string;
  onUploadSuccess?: (url: string, filename: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileInfo {
  file: File;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function EnhancedGitHubUploader({
  folderName,
  acceptedTypes = '.json,.txt,.csv',
  onUploadSuccess,
  onUploadError,
  className = '',
}: EnhancedGitHubUploaderProps) {
  // GitHub config state
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [rememberSettings, setRememberSettings] = useState(true);

  // File state
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileName, setFileName] = useState('');

  // Upload state
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = loadGitHubConfig();
    if (savedConfig.owner || savedConfig.repo || savedConfig.token) {
      setConfig(savedConfig);
    }
  }, []);

  // Save config when changed (if remember is enabled)
  useEffect(() => {
    if (rememberSettings && isConfigComplete(config)) {
      saveGitHubConfig(config as GitHubConfig);
    }
  }, [config, rememberSettings]);

  const handleFileSelect = useCallback((file: File) => {
    setFileInfo({ file });
    setFileName(file.name);
    setStatus('idle');
    setMessage('');
    setUploadedUrl(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!fileInfo || !isConfigComplete(config) || !fileName) {
      setMessage('Please fill in all fields and select a file');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setMessage('');

    try {
      const path = `assets/${folderName}/${fileName}`;

      // Check if file already exists on GitHub
      const existingSha = await getFileSha(config as GitHubConfig, path);
      if (existingSha) {
        setStatus('error');
        setMessage(`File "${fileName}" already exists in assets/${folderName}/`);
        onUploadError?.(`File "${fileName}" already exists`);
        return;
      }

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      let result;

      // Check if file is binary or text
      const isBinary = !fileInfo.file.type.startsWith('text/') &&
        !fileInfo.file.name.endsWith('.json') &&
        !fileInfo.file.name.endsWith('.txt') &&
        !fileInfo.file.name.endsWith('.csv');

      if (isBinary) {
        result = await uploadBinaryFile(
          config as GitHubConfig,
          fileInfo.file,
          path,
          `Upload: ${fileName}`
        );
      } else {
        const content = await fileInfo.file.text();
        result = await uploadFile(
          config as GitHubConfig,
          { path, content },
          `Upload: ${fileName}`
        );
      }

      clearInterval(progressInterval);

      if (result.success) {
        setProgress(100);
        setStatus('success');
        setMessage('File uploaded successfully!');
        setUploadedUrl(result.url || null);
        onUploadSuccess?.(result.url || '', fileName);

        // Clear file after successful upload
        setTimeout(() => {
          clearFile();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Upload failed');
        onUploadError?.(result.error || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Upload failed');
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const clearFile = () => {
    setFileInfo(null);
    setFileName('');
    setStatus('idle');
    setProgress(0);
    setMessage('');
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const configComplete = isConfigComplete(config);

  return (
    <Card variant="default" padding="lg" className={className}>
      <CardHeader
        title="Upload to GitHub"
        subtitle={`Files will be uploaded to the assets/${folderName} folder`}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? 'Hide Settings' : 'Settings'}
          </Button>
        }
      />

      <CardBody className="space-y-6">
        {/* GitHub Configuration */}
        {showConfig && (
          <div className="space-y-4 pb-4 border-b border-[var(--color-border)] animate-slideDown">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Repository Owner"
                value={config.owner || ''}
                onChange={(e) => setConfig({ ...config, owner: (e.target as HTMLInputElement).value })}
                placeholder="username"
              />
              <Input
                label="Repository Name"
                value={config.repo || ''}
                onChange={(e) => setConfig({ ...config, repo: (e.target as HTMLInputElement).value })}
                placeholder="repo-name"
              />
            </div>

            <Input
              label="GitHub Personal Access Token"
              type="password"
              value={config.token || ''}
              onChange={(e) => setConfig({ ...config, token: (e.target as HTMLInputElement).value })}
              placeholder="ghp_xxxxxxxxxxxx"
              hint="Create at GitHub Settings → Developer settings → Personal access tokens"
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSettings}
                onChange={(e) => setRememberSettings(e.target.checked)}
                className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text-muted)]">
                Remember settings in this browser
              </span>
            </label>
          </div>
        )}

        {/* Config Status Badge */}
        {!showConfig && (
          <div className="flex items-center gap-2">
            <Badge
              variant={configComplete ? 'success' : 'warning'}
              size="sm"
            >
              {configComplete ? 'Connected' : 'Not Configured'}
            </Badge>
            {!configComplete && (
              <span className="text-sm text-[var(--color-text-muted)]">
                Click Settings to configure GitHub
              </span>
            )}
          </div>
        )}

        {/* Drop Zone */}
        <div
          className={`
            drop-zone rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging ? 'drag-over' : ''}
            ${!configComplete ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => configComplete && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={configComplete ? 0 : -1}
          onKeyDown={(e) => e.key === 'Enter' && configComplete && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleInputChange}
            className="hidden"
            disabled={!configComplete}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="text-[var(--color-text-muted)]">
              <UploadIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-primary)] font-semibold">Click to upload</span>
                {' or drag and drop'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Data files (JSON, TXT, CSV)
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {fileInfo && (
          <div className="space-y-4 animate-slideUp">
            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
              {/* File Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 flex items-center justify-center bg-[var(--color-primary-light)] rounded-lg">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text)] truncate">
                  {fileInfo.file.name}
                </p>
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] mt-1">
                  <span>{formatFileSize(fileInfo.file.size)}</span>
                  <Badge variant="default" size="sm">
                    Data
                  </Badge>
                </div>
              </div>

              {/* Clear Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                aria-label="Remove file"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Filename Input */}
            <Input
              label="Filename in GitHub"
              value={fileName}
              onChange={(e) => setFileName((e.target as HTMLInputElement).value)}
              hint={`Will be saved as: assets/${folderName}/${fileName}`}
            />
          </div>
        )}

        {/* Upload Progress */}
        {status === 'uploading' && (
          <div className="space-y-2">
            <Progress value={progress} showLabel variant="gradient" animated />
            <p className="text-sm text-center text-[var(--color-text-muted)]">Uploading...</p>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <div
            className={`
              rounded-xl border overflow-hidden animate-slideDown
              ${status === 'success'
                ? 'border-[var(--color-success)] bg-[var(--color-success-light)]'
                : 'border-[var(--color-danger)] bg-[var(--color-danger-light)]'}
            `}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                status === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
              }`}>
                <span className="text-white">
                  {status === 'success' ? <CheckIcon /> : <ErrorIcon />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  status === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }`}>
                  {status === 'success' ? 'Upload Complete' : 'Upload Failed'}
                </p>
                <p className={`text-xs mt-0.5 ${
                  status === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                } opacity-80`}>
                  {message}
                </p>
              </div>
            </div>
            {uploadedUrl && (
              <div className="px-4 py-2 border-t border-[var(--color-success)] border-opacity-20 bg-[var(--color-success-light)]">
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--color-success)] hover:underline flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!fileInfo || !configComplete || status === 'uploading' || !fileName}
          isLoading={status === 'uploading'}
          fullWidth
          size="lg"
        >
          Upload to GitHub
        </Button>
      </CardBody>
    </Card>
  );
}
