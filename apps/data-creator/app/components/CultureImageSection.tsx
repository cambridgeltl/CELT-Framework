'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { useImageStaging, generateImageFilename } from '../contexts/ImageStagingContext';

interface CultureImageSectionProps {
  stepId: string;           // Unique ID for staging (e.g., "deck-1-step-0")
  imageFilename: string;    // Current image filename (src field)
  onImageChange: (filename: string) => void;
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

export default function CultureImageSection({
  stepId,
  imageFilename,
  onImageChange,
  disabled = false,
}: CultureImageSectionProps) {
  const { stageImage, getStagedForCard, removeStaged } = useImageStaging();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use stepId as the cardId for staging
  const stagedImage = getStagedForCard(stepId);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG, JPG, GIF, WEBP)');
      return;
    }

    // Get extension from file
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';

    // Stage the image
    stageImage(stepId, `Step ${stepId}`, file, file.name);

    // Compute target filename and update form
    const targetFilename = generateImageFilename(stepId).replace('.png', `.${ext}`);
    onImageChange(targetFilename);
  }, [stepId, stageImage, onImageChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = useCallback(() => {
    if (stagedImage) {
      removeStaged(stagedImage.id);
    }
    onImageChange('');
  }, [stagedImage, removeStaged, onImageChange]);

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* No image staged - show upload area */}
      {!stagedImage && !imageFilename && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]'
            }
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
            <UploadIcon />
            <p className="text-sm">
              <span className="text-[var(--color-primary)] font-medium">Click to upload</span>
              {' or drag and drop'}
            </p>
            <p className="text-xs">PNG, JPG, GIF, WEBP</p>
          </div>
        </div>
      )}

      {/* Image filename set but not staged (existing image) */}
      {!stagedImage && imageFilename && (
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-muted)]">
              <UploadIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {imageFilename}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Existing image file
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Replace
              </Button>
              <button
                onClick={handleRemove}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                aria-label="Remove image"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image staged - show preview */}
      {stagedImage && (
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg space-y-3">
          {/* Image preview */}
          <div className="relative">
            <img
              src={stagedImage.url}
              alt="Preview"
              className="w-full h-40 object-contain rounded-lg bg-[var(--color-bg-tertiary)]"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-[var(--color-danger)] text-[var(--color-danger-text)] rounded-full hover:opacity-90 transition-colors"
              aria-label="Remove image"
            >
              <TrashIcon />
            </button>
          </div>

          {/* File info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">
                {stagedImage.targetFilename}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Original: {stagedImage.originalFilename}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
