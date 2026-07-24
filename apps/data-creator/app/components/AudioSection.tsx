'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import AudioRecorder from './AudioRecorder';
import { useAudioStaging, generateDictionaryAudioPath } from '../contexts/AudioStagingContext';

interface AudioSectionProps {
  wordId: string;        // The Dzardzongke word (used for staging key and filename)
  wordDisplay: string;   // Display version of the word
  englishMeaning: string; // English meaning (used for validation)
  disabled?: boolean;
}

// Format duration to mm:ss
function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

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

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function AudioSection({
  wordId,
  wordDisplay,
  englishMeaning,
  disabled = false,
}: AudioSectionProps) {
  const { stageAudio, getStagedForWord, removeStaged } = useAudioStaging();
  const [showRecorder, setShowRecorder] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const stagedAudio = getStagedForWord(wordId);
  // Generate full path: assets/audio/dictionary_words/{dz_word}.wav
  const targetPath = generateDictionaryAudioPath(wordId);
  const targetFilename = targetPath.split('/').pop() || targetPath;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    // Get extension from file
    const ext = file.name.split('.').pop()?.toLowerCase() || 'wav';
    // Generate full path: assets/audio/dictionary_words/{dz_word}.ext
    const computedTargetPath = generateDictionaryAudioPath(wordId, ext);

    await stageAudio(wordId, wordDisplay, file, file.name, 'upload', computedTargetPath);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [wordId, wordDisplay, stageAudio]);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    // Generate full path: assets/audio/dictionary_words/{dz_word}.wav
    const computedTargetPath = generateDictionaryAudioPath(wordId, 'wav');

    await stageAudio(wordId, wordDisplay, blob, 'Recording', 'recording', computedTargetPath);
    setShowRecorder(false);
  }, [wordId, wordDisplay, stageAudio]);

  const handleRemove = useCallback(() => {
    if (stagedAudio) {
      removeStaged(stagedAudio.id);
    }
  }, [stagedAudio, removeStaged]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // No dz word yet - show disabled state (also require english meaning for complete entry)
  if (!wordId.trim() || !englishMeaning.trim()) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          Audio
        </label>
        <div className="p-4 border-2 border-dashed border-[var(--color-border)] rounded-lg text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Enter Dzardzongke word and English translation first to add audio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
        Audio
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* No audio staged - show upload/record options */}
      {!stagedAudio && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Upload
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<MicIcon />}
            onClick={() => setShowRecorder(true)}
            disabled={disabled}
          >
            Record
          </Button>
        </div>
      )}

      {/* Audio staged - show preview */}
      {stagedAudio && (
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg space-y-3">
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={stagedAudio.url}
            onEnded={handleAudioEnded}
          />

          {/* File info and controls */}
          <div className="flex items-center gap-3">
            {/* Play button */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:opacity-90 transition-colors flex-shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {stagedAudio.originalFilename}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Will be saved as: <span className="font-mono">{stagedAudio.targetFilename}</span>
                {stagedAudio.duration ? ` (${formatDuration(stagedAudio.duration)})` : ''}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
              aria-label="Remove audio"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      <Modal
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        title="Record Audio"
        size="sm"
      >
        <AudioRecorder
          wordDisplay={wordDisplay}
          targetFilename={targetFilename}
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setShowRecorder(false)}
        />
      </Modal>
    </div>
  );
}
