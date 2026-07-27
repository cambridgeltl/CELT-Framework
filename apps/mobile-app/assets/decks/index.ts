// Auto-import all deck files dynamically
// Any JSON file in this folder will be automatically loaded
// Language is determined by each deck's own "lang" field (defaults to "dz" if absent)
// so adding a new language is just a matter of adding files with lang: "<code>" — no code changes needed.

import type { Deck } from '../../app/types/deck';

// Use require.context to dynamically load all JSON files
const deckContext = require.context('./', false, /\.json$/);

// Get all deck files and filter/categorize them
const allDecks = deckContext.keys()
  .filter(key => !key.includes('schema')) // Exclude schema files
  .map(key => deckContext(key) as Deck);

// Group decks by language code (defaults to 'dz' when a deck has no "lang" field)
export const decksByLanguage: Record<string, Deck[]> = {};
allDecks.forEach((deck) => {
  const lang = deck.lang || 'dz';
  if (!decksByLanguage[lang]) decksByLanguage[lang] = [];
  decksByLanguage[lang].push(deck);
});

export function getDecksByLanguage(lang: string): Deck[] {
  return decksByLanguage[lang] || [];
}

export function getAvailableDeckLanguages(): string[] {
  return Object.keys(decksByLanguage);
}

// Backward-compatible named exports
export const dzDecks: Deck[] = getDecksByLanguage('dz');
export const quDecks: Deck[] = getDecksByLanguage('qu');
