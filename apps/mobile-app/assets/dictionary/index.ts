// Auto-import all dictionary files dynamically
// Any .dict.json file in this folder will be automatically loaded
// Language is determined by each file's own top-level "lang" field (defaults to "dz" if absent)
// so adding a new language is just a matter of adding a file with lang: "<code>" — no code changes needed.

export type DictionaryShape = {
  lang?: string;
  entries: Array<{
    dz?: string;
    en?: string;
    example?: string;
    exampleEn?: string;
    audio?: string;
  }>;
};

// Use require.context to dynamically load all .dict.json files
const dictContext = require.context('./', false, /\.dict\.json$/);

// Get all dictionary files and merge entries by language code
const allDictionaries: Record<string, DictionaryShape> = {};

dictContext.keys().forEach(key => {
  const dictData = dictContext(key) as DictionaryShape;
  const langCode = dictData.lang || 'dz';

  // Merge entries if language code already exists
  if (allDictionaries[langCode]) {
    allDictionaries[langCode].entries = [
      ...allDictionaries[langCode].entries,
      ...dictData.entries
    ];
  } else {
    allDictionaries[langCode] = { ...dictData, lang: langCode };
  }
});

export function getDictionaryByLanguage(lang: string): DictionaryShape {
  return allDictionaries[lang] || { entries: [] };
}

export function getAvailableDictionaryLanguages(): string[] {
  return Object.keys(allDictionaries);
}

// Backward-compatible named exports
export const dzDictionary: DictionaryShape = getDictionaryByLanguage('dz');
export const quDictionary: DictionaryShape = getDictionaryByLanguage('qu');

// Export all dictionaries for advanced usage
export const dictionaries = allDictionaries;
