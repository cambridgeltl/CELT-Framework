'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Deck, Card as FlashCard } from '../models/Deck';

// Deck metadata for the dashboard
export interface DeckMeta {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DecksContextValue {
  // State
  decks: DeckMeta[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;

  // Deck operations
  loadDecks: () => void;
  createDeck: (title: string, description?: string) => DeckMeta;
  updateDeckMeta: (id: string, title: string, description: string) => void;
  deleteDeck: (id: string) => void;
  selectDeck: (id: string) => void;
  deselectDeck: () => void;

  // Card operations (for current deck)
  addCard: (card: FlashCard) => boolean;
  updateCard: (oldId: string, card: FlashCard) => boolean;
  removeCard: (cardId: string) => void;

  // Persistence
  saveDeck: (deck: Deck) => void;

  // Import
  importDecks: (decksData: unknown[]) => number;
}

const STORAGE_KEY = 'dzardzongke-decks';

const DecksContext = createContext<DecksContextValue | undefined>(undefined);

// Generate a URL-friendly ID from title
function generateId(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);

  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}

export function DecksProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<DeckMeta[]>([]);
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all decks metadata from localStorage
  const loadDecks = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDecks(parsed.decks || []);
      } else {
        setDecks([]);
      }
    } catch (err) {
      console.error('Failed to load decks:', err);
      setError('Failed to load decks');
      setDecks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load decks on mount
  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  // Save decks metadata to localStorage
  const saveDecksMetadata = useCallback((newDecks: DeckMeta[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks: newDecks }));
    } catch (err) {
      console.error('Failed to save decks metadata:', err);
    }
  }, []);

  // Save a full deck (with cards) to localStorage
  const saveDeck = useCallback((deck: Deck) => {
    try {
      const deckKey = `${STORAGE_KEY}-deck-${deck.id}`;
      localStorage.setItem(deckKey, deck.toJSONString());

      // Update metadata
      setDecks(prev => {
        const updated = prev.map(d =>
          d.id === deck.id
            ? { ...d, cardCount: deck.getCardCount(), updatedAt: new Date().toISOString() }
            : d
        );
        saveDecksMetadata(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to save deck:', err);
    }
  }, [saveDecksMetadata]);

  // Load a full deck from localStorage
  const loadDeck = useCallback((id: string): Deck | null => {
    try {
      const deckKey = `${STORAGE_KEY}-deck-${id}`;
      const stored = localStorage.getItem(deckKey);

      if (stored) {
        const parsed = JSON.parse(stored);
        const cards = (parsed.cards || []).map((c: Record<string, unknown>) =>
          new FlashCard(
            c.id as string,
            c.front as string,
            c.back as string,
            c.notes as string || '',
            c.image as string || ''
          )
        );
        return new Deck(parsed.id, parsed.title, parsed.description, cards);
      }

      // If no saved data, create empty deck from metadata
      const meta = decks.find(d => d.id === id);
      if (meta) {
        return new Deck(meta.id, meta.title, meta.description, []);
      }

      return null;
    } catch (err) {
      console.error('Failed to load deck:', err);
      return null;
    }
  }, [decks]);

  // Create a new deck
  const createDeck = useCallback((title: string, description: string = ''): DeckMeta => {
    const id = generateId(title);
    const now = new Date().toISOString();

    const newDeckMeta: DeckMeta = {
      id,
      title,
      description,
      cardCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save empty deck
    const newDeck = new Deck(id, title, description, []);
    const deckKey = `${STORAGE_KEY}-deck-${id}`;
    localStorage.setItem(deckKey, newDeck.toJSONString());

    // Update metadata
    setDecks(prev => {
      const updated = [...prev, newDeckMeta];
      saveDecksMetadata(updated);
      return updated;
    });

    return newDeckMeta;
  }, [saveDecksMetadata]);

  // Update deck metadata
  const updateDeckMeta = useCallback((id: string, title: string, description: string) => {
    setDecks(prev => {
      const updated = prev.map(d =>
        d.id === id
          ? { ...d, title, description, updatedAt: new Date().toISOString() }
          : d
      );
      saveDecksMetadata(updated);
      return updated;
    });

    // Also update the saved deck if it exists
    const deck = loadDeck(id);
    if (deck) {
      const updatedDeck = new Deck(id, title, description, deck.getAllCards());
      saveDeck(updatedDeck);
    }

    // Update current deck if it's the one being edited
    if (currentDeck?.id === id) {
      setCurrentDeck(prev => prev ? new Deck(id, title, description, prev.getAllCards()) : null);
    }
  }, [saveDecksMetadata, loadDeck, saveDeck, currentDeck]);

  // Delete a deck
  const deleteDeck = useCallback((id: string) => {
    // Remove deck data
    const deckKey = `${STORAGE_KEY}-deck-${id}`;
    localStorage.removeItem(deckKey);

    // Update metadata
    setDecks(prev => {
      const updated = prev.filter(d => d.id !== id);
      saveDecksMetadata(updated);
      return updated;
    });

    // Deselect if this was the current deck
    if (currentDeck?.id === id) {
      setCurrentDeck(null);
    }
  }, [saveDecksMetadata, currentDeck]);

  // Select a deck to view/edit
  const selectDeck = useCallback((id: string) => {
    setIsLoading(true);
    const deck = loadDeck(id);
    setCurrentDeck(deck);
    setIsLoading(false);
  }, [loadDeck]);

  // Deselect current deck (go back to dashboard)
  const deselectDeck = useCallback(() => {
    setCurrentDeck(null);
  }, []);

  // Add a card to the current deck
  const addCard = useCallback((card: FlashCard): boolean => {
    if (!currentDeck) return false;

    if (!currentDeck.addCard(card)) {
      return false;
    }

    const updatedDeck = new Deck(
      currentDeck.id,
      currentDeck.title,
      currentDeck.description,
      currentDeck.getAllCards()
    );

    setCurrentDeck(updatedDeck);
    saveDeck(updatedDeck);
    return true;
  }, [currentDeck, saveDeck]);

  // Update a card in the current deck
  const updateCard = useCallback((oldId: string, card: FlashCard): boolean => {
    if (!currentDeck) return false;

    currentDeck.removeCard(oldId);

    if (!currentDeck.addCard(card)) {
      return false;
    }

    const updatedDeck = new Deck(
      currentDeck.id,
      currentDeck.title,
      currentDeck.description,
      currentDeck.getAllCards()
    );

    setCurrentDeck(updatedDeck);
    saveDeck(updatedDeck);
    return true;
  }, [currentDeck, saveDeck]);

  // Remove a card from the current deck
  const removeCard = useCallback((cardId: string) => {
    if (!currentDeck) return;

    currentDeck.removeCard(cardId);

    const updatedDeck = new Deck(
      currentDeck.id,
      currentDeck.title,
      currentDeck.description,
      currentDeck.getAllCards()
    );

    setCurrentDeck(updatedDeck);
    saveDeck(updatedDeck);
  }, [currentDeck, saveDeck]);

  // Import decks from JSON data
  const importDecks = useCallback((decksData: unknown[]): number => {
    let imported = 0;
    const existingIds = new Set(decks.map(d => d.id));

    decksData.forEach((deckData) => {
      try {
        const data = deckData as Record<string, unknown>;
        const deck = Deck.fromJSON(data);

        // Generate ID if not present
        if (!deck.id) {
          deck.id = generateId(deck.title || 'imported-deck');
        }

        // Skip if deck with this ID already exists
        if (existingIds.has(deck.id)) {
          return; // skip duplicate
        }

        const now = new Date().toISOString();
        const newDeckMeta: DeckMeta = {
          id: deck.id,
          title: deck.title || 'Imported Deck',
          description: deck.description || '',
          cardCount: deck.getCardCount(),
          createdAt: now,
          updatedAt: now,
        };

        // Save deck data
        const deckKey = `${STORAGE_KEY}-deck-${deck.id}`;
        localStorage.setItem(deckKey, deck.toJSONString());

        // Track this ID so subsequent items in the same batch are also deduplicated
        existingIds.add(deck.id);

        // Update metadata
        setDecks(prev => {
          const updated = [...prev, newDeckMeta];
          saveDecksMetadata(updated);
          return updated;
        });

        imported++;
      } catch (err) {
        console.error('Failed to import deck:', err);
      }
    });

    return imported;
  }, [decks, saveDecksMetadata]);

  return (
    <DecksContext.Provider
      value={{
        decks,
        currentDeck,
        isLoading,
        error,
        loadDecks,
        createDeck,
        updateDeckMeta,
        deleteDeck,
        selectDeck,
        deselectDeck,
        addCard,
        updateCard,
        removeCard,
        saveDeck,
        importDecks,
      }}
    >
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks(): DecksContextValue {
  const context = useContext(DecksContext);
  if (!context) {
    throw new Error('useDecks must be used within a DecksProvider');
  }
  return context;
}
