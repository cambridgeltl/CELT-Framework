'use client';

import React from 'react';

export type MediaCategory = 'deck-images' | 'culture-images' | 'dict-audio' | 'conv-audio';

interface MediaInstructionsProps {
  category: MediaCategory;
  onCategoryChange: (cat: MediaCategory) => void;
  selectedDeckId?: string;
  onDeckChange?: (deckId: string) => void;
  decks?: Array<{ id: string; title: string }>;
}

const categories: Array<{ value: MediaCategory; label: string; icon: string }> = [
  {
    value: 'deck-images',
    label: 'Deck Images',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    value: 'culture-images',
    label: 'Culture Images',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    value: 'dict-audio',
    label: 'Dict Audio',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
  {
    value: 'conv-audio',
    label: 'Conv Audio',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
];

const instructions: Record<MediaCategory, { format: string; naming: string; example: string; targetPath: string }> = {
  'deck-images': {
    format: 'PNG only (.png)',
    naming: 'Name each file to match the card ID in the deck',
    example: 'bird.png, cat.png, dog.png',
    targetPath: 'assets/images/decks/{deck-id}/',
  },
  'culture-images': {
    format: 'PNG only (.png)',
    naming: 'Name each file to match the image step src field',
    example: 'culture1.png, map-overview.png',
    targetPath: 'assets/images/culture/',
  },
  'dict-audio': {
    format: 'Audio (.wav, .mp3, .m4a, .aac)',
    naming: 'Name each file to match the Dzongkha word',
    example: 'hello.wav, water.wav, bird.mp3',
    targetPath: 'assets/audio/dictionary_words/',
  },
  'conv-audio': {
    format: 'Audio (.wav, .mp3, .m4a, .aac)',
    naming: 'Name: {conversationId}_{exchangeNumber}_{A or B}',
    example: 'basic-greeting_1_A.wav, at-the-market_2_B.wav',
    targetPath: 'assets/audio/conversations/{conversationId}/',
  },
};

export default function MediaInstructions({
  category,
  onCategoryChange,
  selectedDeckId,
  onDeckChange,
  decks,
}: MediaInstructionsProps) {
  const info = instructions[category];

  return (
    <div className="space-y-3">
      {/* Category selector */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          Media Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`
                flex items-center gap-2 p-2 rounded-lg text-xs transition-all
                ${category === cat.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-hover-overlay)] hover:text-[var(--color-text)]'
                }
              `}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
              </svg>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deck selector (only for deck images) */}
      {category === 'deck-images' && decks && onDeckChange && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
            Target Deck
          </label>
          <select
            value={selectedDeckId || ''}
            onChange={(e) => onDeckChange(e.target.value)}
            className="w-full p-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Select a deck...</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.title} ({d.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Instruction box */}
      <div className="p-3 rounded-lg bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[var(--color-info)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-[var(--color-info)]">Naming Guide</span>
        </div>
        <div className="text-xs text-[var(--color-info)] space-y-0.5">
          <p><strong>Format:</strong> {info.format}</p>
          <p><strong>Naming:</strong> {info.naming}</p>
          <p><strong>Example:</strong> <code className="bg-[var(--color-info)]/10 px-1 rounded">{info.example}</code></p>
          <p><strong>Target:</strong> <code className="bg-[var(--color-info)]/10 px-1 rounded">
            {category === 'deck-images' && selectedDeckId
              ? info.targetPath.replace('{deck-id}', selectedDeckId)
              : info.targetPath}
          </code></p>
        </div>
      </div>
    </div>
  );
}

export function getAcceptString(category: MediaCategory): string {
  if (category === 'deck-images' || category === 'culture-images') {
    return 'image/png';
  }
  return 'audio/wav,audio/mpeg,audio/mp4,audio/aac,audio/x-m4a,.wav,.mp3,.m4a,.aac';
}

export function isValidMediaFile(file: File, category: MediaCategory): boolean {
  if (category === 'deck-images' || category === 'culture-images') {
    return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  }
  const audioExts = ['.wav', '.mp3', '.m4a', '.aac'];
  return audioExts.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function getTargetPath(file: File, category: MediaCategory, deckId?: string): string {
  switch (category) {
    case 'deck-images':
      return `assets/images/decks/${deckId || 'unknown'}/${file.name}`;
    case 'culture-images':
      return `assets/images/culture/${file.name}`;
    case 'dict-audio':
      return `assets/audio/dictionary_words/${file.name}`;
    case 'conv-audio': {
      const basename = file.name.replace(/\.[^.]+$/, '');
      // Pattern: {convId}_{number}_{A|B} — greedy so "basic-greeting_1_A" → convId="basic-greeting"
      const match = basename.match(/^(.+)_(\d+)_([AB])$/);
      if (match) {
        const [, convId] = match;
        return `assets/audio/conversations/${convId}/${file.name}`;
      }
      return `assets/audio/conversations/unknown/${file.name}`;
    }
  }
}
