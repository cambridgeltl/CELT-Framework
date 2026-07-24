'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Category,
  Conversation,
  Exchange,
  SpeakerType,
  ConversationsData,
  ConversationDataManager,
  createCategory,
  createConversation,
  createExchange,
  generateId,
} from '../models/Conversation';

interface ConversationsContextValue {
  // Data
  categories: Category[];

  // Category operations
  addCategory: (id: string, title: string, description: string) => Category | null;
  updateCategory: (id: string, title: string, description: string) => boolean;
  removeCategory: (id: string) => void;

  // Conversation operations
  addConversation: (categoryId: string, id: string, title: string) => Conversation | null;
  updateConversation: (categoryId: string, conversationId: string, title: string) => boolean;
  removeConversation: (categoryId: string, conversationId: string) => void;

  // Exchange operations
  addExchange: (categoryId: string, conversationId: string, speaker: SpeakerType, english: string, dzardzongke: string, audio?: string) => boolean;
  updateExchange: (categoryId: string, conversationId: string, index: number, updates: Partial<Exchange>) => boolean;
  removeExchange: (categoryId: string, conversationId: string, index: number) => void;

  // Import/Export
  importData: (json: string) => { success: boolean; message: string };
  exportData: () => string;
  clearAll: () => void;

  // Stats
  stats: {
    categories: number;
    conversations: number;
    exchanges: number;
  };
}

const STORAGE_KEY = 'dzardzongke-conversations';

const ConversationsContext = createContext<ConversationsContextValue | undefined>(undefined);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<ConversationDataManager>(new ConversationDataManager({ categories: [] }));

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that parsed data has the expected structure
        if (parsed && typeof parsed === 'object') {
          setManager(ConversationDataManager.fromJSON(parsed));
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      // Reset to empty state on error
      setManager(new ConversationDataManager());
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveData = useCallback((newManager: ConversationDataManager) => {
    setManager(newManager);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newManager.toJSON()));
    } catch (err) {
      console.error('Failed to save conversations:', err);
    }
  }, []);

  // Category operations
  const addCategory = useCallback((id: string, title: string, description: string): Category | null => {
    const category = createCategory(id, title, description);

    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    if (newManager.addCategory(category)) {
      saveData(newManager);
      return category;
    }
    return null;
  }, [manager, saveData]);

  const updateCategory = useCallback((id: string, title: string, description: string): boolean => {
    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    const result = newManager.updateCategory(id, { title, description });
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const removeCategory = useCallback((id: string) => {
    const newManager = new ConversationDataManager({
      categories: manager.data.categories.filter(c => c.id !== id)
    });
    saveData(newManager);
  }, [manager, saveData]);

  // Conversation operations
  const addConversation = useCallback((categoryId: string, id: string, title: string): Conversation | null => {
    const conversation = createConversation(id, title);

    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    if (newManager.addConversation(categoryId, conversation)) {
      saveData(newManager);
      return conversation;
    }
    return null;
  }, [manager, saveData]);

  const updateConversation = useCallback((categoryId: string, conversationId: string, title: string): boolean => {
    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    const result = newManager.updateConversation(categoryId, conversationId, { title });
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const removeConversation = useCallback((categoryId: string, conversationId: string) => {
    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    newManager.removeConversation(categoryId, conversationId);
    saveData(newManager);
  }, [manager, saveData]);

  // Exchange operations
  const addExchange = useCallback((
    categoryId: string,
    conversationId: string,
    speaker: SpeakerType,
    english: string,
    dzardzongke: string,
    audio?: string
  ): boolean => {
    const exchange = createExchange(speaker, english, dzardzongke, audio);

    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    if (newManager.addExchange(categoryId, conversationId, exchange)) {
      saveData(newManager);
      return true;
    }
    return false;
  }, [manager, saveData]);

  const updateExchange = useCallback((
    categoryId: string,
    conversationId: string,
    index: number,
    updates: Partial<Exchange>
  ): boolean => {
    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    const result = newManager.updateExchange(categoryId, conversationId, index, updates);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const removeExchange = useCallback((categoryId: string, conversationId: string, index: number) => {
    const newManager = new ConversationDataManager(JSON.parse(JSON.stringify(manager.data)));
    newManager.removeExchange(categoryId, conversationId, index);
    saveData(newManager);
  }, [manager, saveData]);

  // Import/Export
  const importData = useCallback((json: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(json);

      // Validate structure - expect { categories: [...] }
      if (!parsed.categories || !Array.isArray(parsed.categories)) {
        return { success: false, message: 'Invalid format: expected { categories: [...] }' };
      }

      const incoming = ConversationDataManager.fromJSON(parsed);

      // Merge with existing data instead of replacing
      const existingData: ConversationsData = JSON.parse(JSON.stringify(manager.data));
      const existingCatIds = new Set(existingData.categories.map(c => c.id));

      let newCategories = 0;
      let newConversations = 0;
      let skippedConversations = 0;

      for (const incomingCat of incoming.data.categories) {
        if (!existingCatIds.has(incomingCat.id)) {
          // Entire category is new — add it
          existingData.categories.push(incomingCat);
          newCategories++;
          newConversations += incomingCat.conversations.length;
        } else {
          // Category exists — merge conversations within it
          const existingCat = existingData.categories.find(c => c.id === incomingCat.id)!;
          const existingConvIds = new Set(existingCat.conversations.map(c => c.id));

          for (const conv of incomingCat.conversations) {
            if (!existingConvIds.has(conv.id)) {
              existingCat.conversations.push(conv);
              newConversations++;
            } else {
              skippedConversations++;
            }
          }
        }
      }

      const mergedManager = new ConversationDataManager(existingData);
      saveData(mergedManager);

      const parts: string[] = [];
      if (newCategories > 0) parts.push(`${newCategories} new categories`);
      if (newConversations > 0) parts.push(`${newConversations} new conversations`);
      if (skippedConversations > 0) parts.push(`${skippedConversations} duplicate conversations skipped`);

      return {
        success: true,
        message: parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'All data already exists — nothing new to import'
      };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [manager, saveData]);

  const exportData = useCallback((): string => {
    return manager.toJSONString();
  }, [manager]);

  const clearAll = useCallback(() => {
    saveData(new ConversationDataManager({ categories: [] }));
  }, [saveData]);

  const stats = {
    categories: manager.getTotalCategories(),
    conversations: manager.getTotalConversations(),
    exchanges: manager.getTotalExchanges(),
  };

  return (
    <ConversationsContext.Provider
      value={{
        categories: manager.data.categories,
        addCategory,
        updateCategory,
        removeCategory,
        addConversation,
        updateConversation,
        removeConversation,
        addExchange,
        updateExchange,
        removeExchange,
        importData,
        exportData,
        clearAll,
        stats,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextValue {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
}
