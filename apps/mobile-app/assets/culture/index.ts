// Auto-import all culture deck files dynamically using require.context
// Any .json file in language subfolders will be automatically loaded
// No script needed - Metro bundler handles this at build time

export type CultureTextStep = {
  type: 'text';
  header?: string;
  text: string;
};

export type CultureImageStep = {
  type: 'image';
  header?: string;
  src: string;
  caption: string;
};

export type CultureQuizOption = { label: string; correct: boolean };

export type CultureQuizSingleStep = {
  type: 'quiz-single';
  header?: string;
  question: string;
  options: CultureQuizOption[];
};

export type CultureQuizMultiStep = {
  type: 'quiz-multi';
  header?: string;
  question: string;
  options: CultureQuizOption[];
};

export type CultureStep =
  | CultureTextStep
  | CultureImageStep
  | CultureQuizSingleStep
  | CultureQuizMultiStep;

export type CultureDeck = {
  id: string;
  title: string;
  steps: CultureStep[];
};

// Use require.context to dynamically load all culture JSON files from subfolders
// The 'true' flag enables recursive search into language subfolders (dz/, qu/, etc.)
const cultureContext = require.context('./', true, /\.json$/);

// Get all culture decks organized by language code
const allCultureDecks: Record<string, CultureDeck[]> = {};

cultureContext.keys().forEach(key => {
  // Extract language code from path (e.g., "./dz/deck-1.json" -> "dz")
  const pathParts = key.replace('./', '').split('/');

  // Skip files not in a language subfolder
  if (pathParts.length < 2) return;

  const langCode = pathParts[0];
  const deckData = cultureContext(key) as CultureDeck;

  // Initialize array for this language if not exists
  if (!allCultureDecks[langCode]) {
    allCultureDecks[langCode] = [];
  }

  allCultureDecks[langCode].push(deckData);
});

// Sort decks by ID within each language for consistent ordering
Object.keys(allCultureDecks).forEach(lang => {
  allCultureDecks[lang].sort((a, b) => a.id.localeCompare(b.id));
});

// Export culture decks by language code
export const dzCultureDecks: CultureDeck[] = allCultureDecks['dz'] || [];
export const quCultureDecks: CultureDeck[] = allCultureDecks['qu'] || [];

// Export all culture decks for advanced usage
export const cultureDecks = allCultureDecks;

// Helper function to get culture decks by language
export function getCultureDecksByLanguage(langCode: string): CultureDeck[] {
  return allCultureDecks[langCode] || [];
}

export function getAvailableCultureLanguages(): string[] {
  return Object.keys(allCultureDecks);
}

// Optional per-language interactive map (assets/culture/maps.json). Root-level JSON files are
// not culture decks, so the loader above skips them.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cultureMaps = require('./maps.json') as Record<string, string>;

export function getCultureMapUrl(lang: string): string | undefined {
  const url = cultureMaps[lang];
  return typeof url === 'string' && url.startsWith('http') ? url : undefined;
}
