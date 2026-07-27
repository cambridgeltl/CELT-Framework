/**
 * Language code storage
 *
 * The language code selected here is stamped onto exported dictionary and
 * conversations JSON (as a top-level "lang" field) and used to build the
 * per-language paths for decks/dictionary/conversations/culture uploads —
 * mirroring the LANG env var used by scripts/export-content.ts in the mobile app.
 */

const LANGUAGE_CODE_KEY = 'languageLearningApp_languageCode';
const DEFAULT_LANGUAGE_CODE = 'dz';

export function getStoredLanguageCode(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE_CODE;
  return localStorage.getItem(LANGUAGE_CODE_KEY) || DEFAULT_LANGUAGE_CODE;
}

export function setStoredLanguageCode(code: string): void {
  if (typeof window === 'undefined') return;
  const sanitized = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  localStorage.setItem(LANGUAGE_CODE_KEY, sanitized || DEFAULT_LANGUAGE_CODE);
}

// The human-readable name for whatever code is currently selected (e.g. "French" for
// "fr") — paired with the Language code setting. Pushed to assets/languages.json on
// upload so the mobile app shows the real name instead of the bare code. Distinct from
// GitHubTokenSlideshow's getStoredLanguageName, which is the overall project/app name
// shown in this tool's own header, not a per-language-code name.
const LANGUAGE_DISPLAY_NAME_KEY = 'languageLearningApp_languageDisplayName';

export function getStoredLanguageDisplayName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LANGUAGE_DISPLAY_NAME_KEY) || '';
}

export function setStoredLanguageDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGE_DISPLAY_NAME_KEY, name.trim());
}

// Known display names for language codes; unknown codes fall back to the uppercased code.
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  dz: 'Dzardzongke',
  qu: 'Quechua',
  de: 'German',
};

export function getLanguageDisplayName(code: string): string {
  if (!code) return '';
  return LANGUAGE_DISPLAY_NAMES[code] || code.toUpperCase();
}
