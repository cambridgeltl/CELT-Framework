import type { Deck } from '../types/deck';

import {
  getAvailableConversationLanguages,
  getConversationsByLanguage,
  type ConversationsData,
} from '../../assets/conversations';
import {
  getAvailableCultureLanguages,
  getCultureDecksByLanguage,
  type CultureDeck,
} from '../../assets/culture';
import { getAvailableDeckLanguages, getDecksByLanguage } from '../../assets/decks';
import {
  getAvailableDictionaryLanguages,
  getDictionaryByLanguage,
  type DictionaryShape,
} from '../../assets/dictionary';

// Any string works as a language code — new languages appear automatically the moment
// content tagged with that code exists (see getAvailableLanguages()).
export type LanguageCode = string;

export type { ConversationsData, DictionaryShape, CultureDeck };

type ContentBundle = {
  decks: Deck[];
  dictionary: DictionaryShape;
  conversations: ConversationsData;
  culture: CultureDeck[];
};

// Discover every language code that has at least one piece of content, across all content types.
function discoverLanguages(): string[] {
  const codes = new Set<string>([
    ...getAvailableDeckLanguages(),
    ...getAvailableDictionaryLanguages(),
    ...getAvailableConversationLanguages(),
    ...getAvailableCultureLanguages(),
  ]);
  // Keep 'dz' first for stable default ordering, then the rest alphabetically.
  return ['dz', ...Array.from(codes).filter((c) => c !== 'dz').sort()].filter((c) => codes.has(c) || c === 'dz');
}

export function getAvailableLanguages(): LanguageCode[] {
  return discoverLanguages();
}

function buildBundle(lang: LanguageCode): ContentBundle {
  return {
    decks: getDecksByLanguage(lang),
    dictionary: getDictionaryByLanguage(lang),
    conversations: getConversationsByLanguage(lang),
    culture: getCultureDecksByLanguage(lang),
  };
}

export const contentRegistry: Record<LanguageCode, ContentBundle> = discoverLanguages().reduce(
  (registry, lang) => {
    registry[lang] = buildBundle(lang);
    return registry;
  },
  {} as Record<LanguageCode, ContentBundle>
);

// Display names for language codes, sourced from assets/languages.json — the export
// script (LANG_NAME) and the data-creator's "Language name" setting both write to this
// file, so a new language's name shows up automatically without any code changes.
// Unknown codes (not yet registered there) fall back to the uppercased code.
const languageNames: Record<string, string> = require('../../assets/languages.json');

export function getLanguageDisplayName(lang: LanguageCode): string {
  return languageNames[lang] || lang.toUpperCase();
}

export const nsDeckId = (lang: LanguageCode, deckId: string) => `${lang}:${deckId}`;

// Quiz image registry
// Map prompt strings (lowercased) to statically imported images.
// Add your images under assets/images (or a subfolder) and register them here.
const reactLogo = require('../../assets/images/react-logo.png');

const baseQuizImageMap: Record<string, any> = {
  // animals / common nouns
  dog: reactLogo,
  bird: reactLogo,
  fish: reactLogo,
  horse: reactLogo,
  cat: reactLogo,
  cow: reactLogo,
  yak: reactLogo,
  water: reactLogo,
  money: reactLogo,
  house: reactLogo,
  sun: reactLogo,
  moon: reactLogo,
  flask: reactLogo,
  // colours
  white: reactLogo,
  yellow: reactLogo,
  black: reactLogo,
  green: reactLogo,
  brown: reactLogo,
  blue: reactLogo,
  red: reactLogo,
  // numbers (if used as prompts)
  one: reactLogo,
  two: reactLogo,
  three: reactLogo,
  four: reactLogo,
  five: reactLogo,
  six: reactLogo,
  seven: reactLogo,
  eight: reactLogo,
  nine: reactLogo,
  ten: reactLogo,
};

// Per-language overrides can be added here if a language needs different quiz images;
// any language without an explicit entry falls back to the shared base map.
const quizImageMapOverrides: Partial<Record<LanguageCode, { byPrompt: Record<string, any> }>> = {};

export function getQuizImageForPrompt(lang: LanguageCode, prompt?: string) {
  if (!prompt) return undefined;
  const key = String(prompt).toLowerCase().trim();
  const byPrompt = quizImageMapOverrides[lang]?.byPrompt ?? baseQuizImageMap;
  return byPrompt[key];
}


