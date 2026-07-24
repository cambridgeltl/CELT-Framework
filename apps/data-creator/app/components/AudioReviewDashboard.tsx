'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Progress } from './ui/Progress';
import { useAudioStaging, StagedAudio } from '../contexts/AudioStagingContext';
import {
  GitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
  uploadBinaryFile,
} from '../utils/githubApi';

interface AudioReviewDashboardProps {
  audioFolder?: string;
  onUploadComplete?: (uploadedFiles: string[]) => void;
  onClose?: () => void;
}

// Format duration to mm:ss
function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface AudioCardProps {
  audio: StagedAudio;
  onRemove: () => void;
}

function AudioCard({ audio, onRemove }: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <div className="p-4 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-all">
      <audio ref={audioRef} src={audio.url} onEnded={handleEnded} />

      <div className="flex items-start gap-3">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Word and File Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-[var(--color-text)] truncate">
            {audio.wordDisplay}
          </h4>
          <p className="text-sm text-[var(--color-text-muted)] font-mono">
            {audio.targetFilename.split('/').pop() || audio.targetFilename}
          </p>
          {audio.duration && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {formatDuration(audio.duration)}
            </p>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
          aria-label="Remove audio"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AudioReviewDashboard({
  audioFolder = 'audio',
  onUploadComplete,
  onClose,
}: AudioReviewDashboardProps) {
  const {
    stagedFiles,
    removeStaged,
    isReadyForUpload,
    markAsUploaded,
  } = useAudioStaging();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const readyForUpload = isReadyForUpload();

  const handleUpload = useCallback(async () => {
    setShowConfirmModal(false);
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress({ current: 0, total: stagedFiles.length });

    const config = loadGitHubConfig();
    if (!isConfigComplete(config)) {
      setUploadError('GitHub is not configured. Please configure GitHub settings first.');
      setIsUploading(false);
      return;
    }

    const uploadedIds: string[] = [];
    const uploadedFilenames: string[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const audio = stagedFiles[i];
      setUploadProgress({ current: i + 1, total: stagedFiles.length });

      try {
        // Use targetFilename directly if it contains full path, otherwise construct path
        const path = audio.targetFilename.startsWith('assets/')
          ? audio.targetFilename
          : `assets/${audioFolder}/${audio.targetFilename}`;
        const filename = audio.targetFilename.split('/').pop() || audio.targetFilename;
        const result = await uploadBinaryFile(
          config as GitHubConfig,
          new File([audio.blob], filename, { type: audio.blob.type }),
          path,
          `Add audio: ${filename}`
        );

        if (result.success) {
          uploadedIds.push(audio.id);
          uploadedFilenames.push(audio.targetFilename);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (err) {
        setUploadError(`Failed to upload ${audio.targetFilename}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsUploading(false);
        return;
      }
    }

    // Mark all as uploaded
    markAsUploaded(uploadedIds);
    setIsUploading(false);
    onUploadComplete?.(uploadedFilenames);
  }, [stagedFiles, audioFolder, markAsUploaded, onUploadComplete]);

  if (stagedFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
          No audio files staged
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Add audio to dictionary entries to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Audio Files
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {stagedFiles.length} {stagedFiles.length === 1 ? 'file' : 'files'} ready to upload
          </p>
        </div>

        {readyForUpload && (
          <div className="w-8 h-8 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] flex items-center justify-center">
            <CheckIcon />
          </div>
        )}
      </div>

      {/* Audio Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stagedFiles.map(audio => (
          <AudioCard
            key={audio.id}
            audio={audio}
            onRemove={() => removeStaged(audio.id)}
          />
        ))}
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="p-4 bg-[var(--color-danger-light)] text-[var(--color-danger)] rounded-lg text-sm">
          {uploadError}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress
            value={(uploadProgress.current / uploadProgress.total) * 100}
            showLabel
            variant="gradient"
            animated
          />
          <p className="text-sm text-center text-[var(--color-text-muted)]">
            Uploading {uploadProgress.current} of {uploadProgress.total}...
          </p>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={() => setShowConfirmModal(true)}
        disabled={!readyForUpload || isUploading}
        fullWidth
        size="lg"
      >
        {isUploading
          ? 'Uploading...'
          : `Upload ${stagedFiles.length} ${stagedFiles.length === 1 ? 'file' : 'files'} to GitHub`
        }
      </Button>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Upload to GitHub"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              fullWidth
            >
              Upload
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">
            Upload {stagedFiles.length} audio {stagedFiles.length === 1 ? 'file' : 'files'} to GitHub?
          </p>

          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 space-y-1">
            {stagedFiles.map(audio => (
              <p key={audio.id} className="text-sm font-mono text-[var(--color-text-muted)]">
                {audio.targetFilename.split('/').pop() || audio.targetFilename}
              </p>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
