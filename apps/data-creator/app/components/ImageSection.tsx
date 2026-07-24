'use client';

import { useRef, useCallback } from 'react';
import { useImageStaging, generateImageFilename } from '../contexts/ImageStagingContext';

interface ImageSectionProps {
  cardId: string;
  cardDisplay: string;
  deckId?: string;
  disabled?: boolean;
}

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function ImageSection({
  cardId,
  cardDisplay,
  deckId,
  disabled = false,
}: ImageSectionProps) {
  const { stageImage, getStagedForCard, removeStaged } = useImageStaging();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stagedImage = getStagedForCard(cardId);
  const targetFilename = generateImageFilename(cardId);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a PNG file
    if (!file.type.startsWith('image/png')) {
      alert('Please select a PNG image file');
      return;
    }

    stageImage(cardId, cardDisplay, file, file.name, deckId);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cardId, cardDisplay, deckId, stageImage]);

  const handleRemove = useCallback(() => {
    if (stagedImage) {
      removeStaged(stagedImage.id);
    }
  }, [stagedImage, removeStaged]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          Card Image (PNG)
        </label>
        {cardId && (
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            → {targetFilename}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !cardId}
      />

      {/* No image staged */}
      {!stagedImage && (
        <button
          onClick={handleUploadClick}
          disabled={disabled || !cardId}
          className={`
            w-full p-4 border-2 border-dashed rounded-xl transition-all
            ${disabled || !cardId
              ? 'border-[var(--color-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <UploadIcon />
            <span className="text-sm font-medium">
              {!cardId ? 'Enter Card ID first' : 'Click to upload PNG image'}
            </span>
          </div>
        </button>
      )}

      {/* Image preview */}
      {stagedImage && (
        <div className="relative p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
          <div className="flex items-start gap-3">
            {/* Image thumbnail */}
            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
              <img
                src={stagedImage.url}
                alt={cardDisplay}
                className="w-full h-full object-cover"
              />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {stagedImage.originalFilename}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Will be saved as: <span className="font-mono">{stagedImage.targetFilename}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[var(--color-success)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-medium">Ready to upload</span>
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
              aria-label="Remove image"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
