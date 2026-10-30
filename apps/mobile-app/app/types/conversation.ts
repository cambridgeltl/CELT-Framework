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
  categories: ConversationCategory[];
}
