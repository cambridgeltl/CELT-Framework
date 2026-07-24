// Conversation data models for language learning dialogues

export type SpeakerType = 'A' | 'B';

export interface Exchange {
  speaker: SpeakerType;
  english: string;
  dzardzongke: string;
  audio?: string;  // Optional audio filename
}

export interface Conversation {
  id: string;
  title: string;
  exchanges: Exchange[];
}

export interface Category {
  id: string;
  title: string;
  description: string;
  conversations: Conversation[];
}

export interface ConversationsData {
  categories: Category[];
}

// Helper class for working with conversation data
export class ConversationDataManager {
  data: ConversationsData;

  constructor(data?: ConversationsData | null) {
    // Ensure data always has a valid structure, normalizing each category
    const rawCategories = data?.categories ?? [];
    this.data = {
      categories: rawCategories.map(cat => ({
        id: cat.id || '',
        title: cat.title || '',
        description: cat.description || '',
        conversations: (cat.conversations ?? []).map(conv => ({
          id: conv.id || '',
          title: conv.title || '',
          exchanges: (conv.exchanges ?? []).map(ex => ({
            speaker: (ex.speaker || 'A') as SpeakerType,
            english: ex.english || '',
            dzardzongke: ex.dzardzongke || '',
            ...(ex.audio ? { audio: ex.audio } : {}),
          })),
        })),
      })),
    };
  }

  // Category operations
  addCategory(category: Category): boolean {
    if (this.data.categories.some(c => c.id === category.id)) {
      return false;
    }
    this.data.categories.push(category);
    return true;
  }

  updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'conversations'>>): boolean {
    const category = this.data.categories.find(c => c.id === id);
    if (!category) return false;
    Object.assign(category, updates);
    return true;
  }

  removeCategory(id: string): boolean {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.categories.splice(index, 1);
    return true;
  }

  getCategory(id: string): Category | undefined {
    return this.data.categories.find(c => c.id === id);
  }

  // Conversation operations
  addConversation(categoryId: string, conversation: Conversation): boolean {
    const category = this.getCategory(categoryId);
    if (!category) return false;
    if (category.conversations.some(c => c.id === conversation.id)) {
      return false;
    }
    category.conversations.push(conversation);
    return true;
  }

  updateConversation(categoryId: string, conversationId: string, updates: Partial<Omit<Conversation, 'id' | 'exchanges'>>): boolean {
    const category = this.getCategory(categoryId);
    if (!category) return false;
    const conversation = category.conversations.find(c => c.id === conversationId);
    if (!conversation) return false;
    Object.assign(conversation, updates);
    return true;
  }

  removeConversation(categoryId: string, conversationId: string): boolean {
    const category = this.getCategory(categoryId);
    if (!category) return false;
    const index = category.conversations.findIndex(c => c.id === conversationId);
    if (index === -1) return false;
    category.conversations.splice(index, 1);
    return true;
  }

  getConversation(categoryId: string, conversationId: string): Conversation | undefined {
    const category = this.getCategory(categoryId);
    return category?.conversations.find(c => c.id === conversationId);
  }

  // Exchange operations
  addExchange(categoryId: string, conversationId: string, exchange: Exchange): boolean {
    const conversation = this.getConversation(categoryId, conversationId);
    if (!conversation) return false;
    conversation.exchanges.push(exchange);
    return true;
  }

  updateExchange(categoryId: string, conversationId: string, index: number, updates: Partial<Exchange>): boolean {
    const conversation = this.getConversation(categoryId, conversationId);
    if (!conversation || index < 0 || index >= conversation.exchanges.length) return false;
    Object.assign(conversation.exchanges[index], updates);
    return true;
  }

  removeExchange(categoryId: string, conversationId: string, index: number): boolean {
    const conversation = this.getConversation(categoryId, conversationId);
    if (!conversation || index < 0 || index >= conversation.exchanges.length) return false;
    conversation.exchanges.splice(index, 1);
    return true;
  }

  // Serialization
  toJSON(): ConversationsData {
    return this.data;
  }

  toJSONString(): string {
    return JSON.stringify(this.data, null, 2);
  }

  static fromJSON(json: ConversationsData | null | undefined): ConversationDataManager {
    return new ConversationDataManager(json);
  }

  // Stats
  getTotalCategories(): number {
    return this.data.categories.length;
  }

  getTotalConversations(): number {
    return this.data.categories.reduce((sum, cat) => sum + cat.conversations.length, 0);
  }

  getTotalExchanges(): number {
    return this.data.categories.reduce((sum, cat) =>
      sum + cat.conversations.reduce((convSum, conv) => convSum + conv.exchanges.length, 0), 0
    );
  }
}

// Generate URL-friendly ID from title
export function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

// Create empty exchange
export function createExchange(speaker: SpeakerType, english: string = '', dzardzongke: string = '', audio?: string): Exchange {
  const exchange: Exchange = {
    speaker,
    english,
    dzardzongke,
  };
  if (audio) {
    exchange.audio = audio;
  }
  return exchange;
}

// Create empty conversation
export function createConversation(id: string, title: string = ''): Conversation {
  return {
    id,
    title,
    exchanges: [],
  };
}

// Create empty category
export function createCategory(id: string, title: string = '', description: string = ''): Category {
  return {
    id,
    title,
    description,
    conversations: [],
  };
}
