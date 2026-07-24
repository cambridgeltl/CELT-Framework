'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Staged image file awaiting upload
export interface StagedImage {
  id: string;
  cardId: string;            // The card ID (used for filename)
  cardDisplay: string;       // Display name for the card
  deckId?: string;
  originalFilename: string;  // Original filename
  targetFilename: string;    // Auto-generated filename based on card ID
  blob: Blob;                // The image data
  url: string;               // Object URL for preview
}

interface ImageStagingContextValue {
  // Staged image files
  stagedFiles: StagedImage[];

  // Actions
  stageImage: (
    cardId: string,
    cardDisplay: string,
    blob: Blob,
    originalFilename: string,
    deckId?: string
  ) => string; // Returns staged image ID

  removeStaged: (id: string) => void;
  clearAllStaged: () => void;

  // Queries
  getStagedForCard: (cardId: string) => StagedImage | undefined;
  isReadyForUpload: () => boolean;

  // Mark as uploaded (removes from staging)
  markAsUploaded: (ids: string[]) => void;
}

const ImageStagingContext = createContext<ImageStagingContextValue | undefined>(undefined);

/**
 * Sanitize a card ID to create a valid filename
 */
function sanitizeFilename(cardId: string): string {
  let sanitized = cardId
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitized || sanitized.length < 2) {
    const hash = Array.from(cardId).reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    sanitized = `card-${Math.abs(hash).toString(36)}`;
  }

  return sanitized;
}

/**
 * Generate the target filename from a card ID
 */
export function generateImageFilename(cardId: string): string {
  const sanitized = sanitizeFilename(cardId);
  return `${sanitized}.png`;
}

export function ImageStagingProvider({ children }: { children: React.ReactNode }) {
  const [stagedFiles, setStagedFiles] = useState<StagedImage[]>([]);

  const stageImage = useCallback((
    cardId: string,
    cardDisplay: string,
    blob: Blob,
    originalFilename: string,
    deckId?: string
  ): string => {
    const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Use original filename to preserve card.image references (e.g. "white-dog.png")
    // Only fall back to generated name if no original filename
    const targetFilename = originalFilename && originalFilename.toLowerCase().endsWith('.png')
      ? originalFilename
      : generateImageFilename(cardId);

    // Create object URL for preview
    const url = URL.createObjectURL(blob);

    const staged: StagedImage = {
      id,
      cardId,
      cardDisplay,
      deckId,
      originalFilename,
      targetFilename,
      blob,
      url,
    };

    // Remove any existing staged image for this card
    setStagedFiles(prev => {
      const existing = prev.find(f => f.cardId === cardId);
      if (existing) {
        URL.revokeObjectURL(existing.url);
      }
      return [...prev.filter(f => f.cardId !== cardId), staged];
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

  const clearAllStaged = useCallback(() => {
    setStagedFiles(prev => {
      prev.forEach(f => URL.revokeObjectURL(f.url));
      return [];
    });
  }, []);

  const getStagedForCard = useCallback((cardId: string): StagedImage | undefined => {
    return stagedFiles.find(f => f.cardId === cardId);
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
    <ImageStagingContext.Provider
      value={{
        stagedFiles,
        stageImage,
        removeStaged,
        clearAllStaged,
        getStagedForCard,
        isReadyForUpload,
        markAsUploaded,
      }}
    >
      {children}
    </ImageStagingContext.Provider>
  );
}

export function useImageStaging(): ImageStagingContextValue {
  const context = useContext(ImageStagingContext);
  if (!context) {
    throw new Error('useImageStaging must be used within an ImageStagingProvider');
  }
  return context;
}
