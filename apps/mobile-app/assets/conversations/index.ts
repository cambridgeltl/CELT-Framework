// Auto-import all conversation files dynamically
// Any .json file in this folder will be automatically loaded
// Language is determined by each file's own top-level "lang" field (defaults to "dz" if absent)
// so adding a new language is just a matter of adding a file with lang: "<code>" — no code changes needed.

export interface Exchange {
  speaker: string;
  english: string;
  /** Target-language line. Internal field name kept for backwards compatibility. */
  dzardzongke: string;
  /** Language-neutral alias for `dzardzongke` (preferred in new content files). */
  target?: string;
}

export interface Conversation {
  id: string;
  title: string;
  exchanges: Exchange[];
}

export interface ConversationCategory {
  id: string;
  title: string;
  description: string;
  conversations: Conversation[];
}

export interface ConversationsData {
  lang?: string;
  categories: ConversationCategory[];
}

// Use require.context to dynamically load all conversation JSON files
const conversationContext = require.context('./', false, /\.json$/);

// Get all conversation files and merge categories by language code
const allConversations: Record<string, ConversationsData> = {};

conversationContext.keys().forEach(key => {
  const raw = conversationContext(key) as ConversationsData;
  const langCode = raw.lang || 'dz';
  // Accept the language-neutral "target" field and normalise it to the internal "dzardzongke" field.
  const convData: ConversationsData = {
    ...raw,
    categories: (raw.categories || []).map((cat) => ({
      ...cat,
      conversations: (cat.conversations || []).map((cv) => ({
        ...cv,
        exchanges: (cv.exchanges || []).map((ex) => ({ ...ex, dzardzongke: ex.dzardzongke ?? ex.target ?? '' })),
      })),
    })),
  };

  // Merge categories if language code already exists
  if (allConversations[langCode]) {
    allConversations[langCode].categories = [
      ...allConversations[langCode].categories,
      ...convData.categories
    ];
  } else {
    allConversations[langCode] = { ...convData, lang: langCode };
  }
});

export function getConversationsByLanguage(lang: string): ConversationsData {
  return allConversations[lang] || { categories: [] };
}

export function getAvailableConversationLanguages(): string[] {
  return Object.keys(allConversations);
}

// Backward-compatible named exports
export const dzConversations: ConversationsData = getConversationsByLanguage('dz');
export const quConversations: ConversationsData = getConversationsByLanguage('qu');

// Export all conversations for advanced usage
export const conversations = allConversations;
