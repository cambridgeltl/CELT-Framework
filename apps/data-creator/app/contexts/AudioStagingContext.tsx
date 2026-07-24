'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Staged audio file awaiting verification and upload
export interface StagedAudio {
  id: string;
  wordId: string;           // The Dzardzongke word (used for filename)
  wordDisplay: string;      // Display version of the word
  originalFilename: string; // Original filename (if uploaded)
  targetFilename: string;   // Auto-generated filename based on word
  blob: Blob;               // The audio data
  url: string;              // Object URL for playback
  duration?: number;        // Duration in seconds
  verified: boolean;        // Has user verified this pairing?
  source: 'upload' | 'recording';
}

interface AudioStagingContextValue {
  // Staged audio files
  stagedFiles: StagedAudio[];

  // Actions
  stageAudio: (
    wordId: string,
    wordDisplay: string,
    blob: Blob,
    originalFilename: string,
    source: 'upload' | 'recording',
    targetPath?: string  // Optional: full path for conversation audio
  ) => Promise<string>; // Returns staged audio ID

  removeStaged: (id: string) => void;
  verifyStaged: (id: string) => void;
  unverifyStaged: (id: string) => void;
  clearAllStaged: () => void;

  // Queries
  getStagedForWord: (wordId: string) => StagedAudio | undefined;
  getUnverifiedCount: () => number;
  getAllVerified: () => StagedAudio[];
  isReadyForUpload: () => boolean;

  // Upload state
  isUploading: boolean;
  uploadProgress: { current: number; total: number };

  // Mark as uploaded (removes from staging)
  markAsUploaded: (ids: string[]) => void;
}

const AudioStagingContext = createContext<AudioStagingContextValue | undefined>(undefined);

/**
 * Sanitize a word to create a valid filename
 * Handles Tibetan script, special characters, spaces, etc.
 */
export function sanitizeFilename(word: string): string {
  // Transliterate common Tibetan characters to romanized form
  // This is a simplified version - could be expanded
  let sanitized = word
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove characters that aren't safe for filenames
    // Keep: letters, numbers, hyphens, and common unicode ranges
    .replace(/[^a-z0-9\u0F00-\u0FFF\u4E00-\u9FFF-]/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');

  // If result is empty or too short, create a fallback
  if (!sanitized || sanitized.length < 2) {
    // Use a hash of the original word
    const hash = Array.from(word).reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    sanitized = `word-${Math.abs(hash).toString(36)}`;
  }

  return sanitized;
}

/**
 * Generate the target filename from a word
 */
export function generateTargetFilename(word: string, extension: string = 'wav'): string {
  const sanitized = sanitizeFilename(word);
  return `${sanitized}.${extension}`;
}

/**
 * Generate the full GitHub path for dictionary audio:
 * assets/audio/dictionary_words/{dz_word}.wav
 */
export function generateDictionaryAudioPath(
  dzWord: string,
  extension: string = 'wav'
): string {
  const sanitized = sanitizeFilename(dzWord);
  return `assets/audio/dictionary_words/${sanitized}.${extension}`;
}

/**
 * Generate conversation audio filename with the naming convention:
 * {textno}_{A or B}.wav
 */
export function generateConversationAudioFilename(
  exchangeIndex: number,
  speaker: 'A' | 'B',
  extension: string = 'wav'
): string {
  const textNo = exchangeIndex + 1; // 1-based numbering
  return `${textNo}_${speaker}.${extension}`;
}

/**
 * Generate the full GitHub path for conversation audio:
 * assets/audio/conversations/{categoryId}/{conversationId}/{textno}_{A or B}.wav
 */
export function generateConversationAudioPath(
  categoryId: string,
  conversationId: string,
  exchangeIndex: number,
  speaker: 'A' | 'B',
  extension: string = 'wav'
): string {
  const sanitizedCategory = sanitizeFilename(categoryId);
  const sanitizedConversation = sanitizeFilename(conversationId);
  const filename = generateConversationAudioFilename(exchangeIndex, speaker, extension);
  return `assets/audio/conversations/${sanitizedCategory}/${sanitizedConversation}/${filename}`;
}

/**
 * Extract category and conversation folder from a conversation audio path
 * e.g., "assets/audio/conversations/greetings/greeting1/1_A.wav" -> "greetings/greeting1"
 */
export function getConversationFolderFromPath(audioPath: string): string {
  const parts = audioPath.split('/');
  // Path format: assets/audio/conversations/{category}/{conversation}/{filename}
  if (parts.length >= 5 && parts[0] === 'assets' && parts[1] === 'audio' && parts[2] === 'conversations') {
    return `${parts[3]}/${parts[4]}`;
  }
  // Legacy path format: assets/audio/conversations/{folder}/{filename}
  if (parts.length >= 4 && parts[0] === 'assets' && parts[1] === 'audio' && parts[2] === 'conversations') {
    return parts[3];
  }
  // Fallback: try to extract from filename
  const filename = parts[parts.length - 1];
  const filenameParts = filename.replace(/\.[^.]+$/, '').split('_');
  return filenameParts.slice(0, -2).join('_') || filenameParts[0];
}

/**
 * Get file extension from filename or blob type
 */
function getExtension(filename: string, blob: Blob): string {
  // Try to get from filename
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback to blob type
  const typeMatch = blob.type.match(/audio\/([a-zA-Z0-9]+)/);
  if (typeMatch) {
    const type = typeMatch[1];
    // Map common MIME subtypes to extensions
    if (type === 'mpeg') return 'mp3';
    if (type === 'x-wav' || type === 'wav') return 'wav';
    if (type === 'ogg') return 'ogg';
    if (type === 'mp4' || type === 'x-m4a') return 'm4a';
    if (type === 'webm') return 'webm';
    return type;
  }

  return 'wav'; // Default
}

/**
 * Get audio duration from a blob
 */
function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });

    audio.src = url;
  });
}

export function AudioStagingProvider({ children }: { children: React.ReactNode }) {
  const [stagedFiles, setStagedFiles] = useState<StagedAudio[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const stageAudio = useCallback(async (
    wordId: string,
    wordDisplay: string,
    blob: Blob,
    originalFilename: string,
    source: 'upload' | 'recording',
    targetPath?: string  // Optional: full path for conversation audio
  ): Promise<string> => {
    // Generate ID and target filename
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const extension = getExtension(originalFilename, blob);
    // Use provided targetPath if available, otherwise generate from wordId
    const targetFilename = targetPath || generateTargetFilename(wordId, extension);

    // Get duration
    const duration = await getAudioDuration(blob);

    // Create object URL for playback
    const url = URL.createObjectURL(blob);

    const staged: StagedAudio = {
      id,
      wordId,
      wordDisplay,
      originalFilename: source === 'recording' ? 'Recording' : originalFilename,
      targetFilename,
      blob,
      url,
      duration,
      verified: true, // Auto-verify - no manual verification needed
      source,
    };

    // Remove any existing staged audio for this word
    setStagedFiles(prev => {
      const existing = prev.find(f => f.wordId === wordId);
      if (existing) {
        URL.revokeObjectURL(existing.url);
      }
      return [...prev.filter(f => f.wordId !== wordId), staged];
    });

    return id;
  }, []);

  const removeStaged = useCallback((id: string) => {
    setStagedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const verifyStaged = useCallback((id: string) => {
    setStagedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, verified: true } : f)
    );
  }, []);

  const unverifyStaged = useCallback((id: string) => {
    setStagedFiles(prev =>
      prev.map(f => f.id === id ? { ...f, verified: false } : f)
    );
  }, []);

  const clearAllStaged = useCallback(() => {
    stagedFiles.forEach(f => URL.revokeObjectURL(f.url));
    setStagedFiles([]);
  }, [stagedFiles]);

  const getStagedForWord = useCallback((wordId: string) => {
    return stagedFiles.find(f => f.wordId === wordId);
  }, [stagedFiles]);

  const getUnverifiedCount = useCallback(() => {
    return stagedFiles.filter(f => !f.verified).length;
  }, [stagedFiles]);

  const getAllVerified = useCallback(() => {
    return stagedFiles.filter(f => f.verified);
  }, [stagedFiles]);

  const isReadyForUpload = useCallback(() => {
    return stagedFiles.length > 0;
  }, [stagedFiles]);

  const markAsUploaded = useCallback((ids: string[]) => {
    setStagedFiles(prev => {
      const toRemove = prev.filter(f => ids.includes(f.id));
      toRemove.forEach(f => URL.revokeObjectURL(f.url));
      return prev.filter(f => !ids.includes(f.id));
    });
  }, []);

  return (
    <AudioStagingContext.Provider
      value={{
        stagedFiles,
        stageAudio,
        removeStaged,
        verifyStaged,
        unverifyStaged,
        clearAllStaged,
        getStagedForWord,
        getUnverifiedCount,
        getAllVerified,
        isReadyForUpload,
        isUploading,
        uploadProgress,
        markAsUploaded,
      }}
    >
      {children}
    </AudioStagingContext.Provider>
  );
}

export function useAudioStaging(): AudioStagingContextValue {
  const context = useContext(AudioStagingContext);
  if (!context) {
    throw new Error('useAudioStaging must be used within an AudioStagingProvider');
  }
  return context;
}
