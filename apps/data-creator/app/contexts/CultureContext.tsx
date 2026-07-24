'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CultureDeck,
  Step,
  CultureDataManager,
  createCultureDeck,
} from '../models/Culture';

interface CultureContextValue {
  // Data
  decks: CultureDeck[];

  // Deck operations
  addDeck: (id: string, title: string) => CultureDeck | null;
  updateDeck: (id: string, title: string) => boolean;
  removeDeck: (id: string) => void;
  getDeck: (id: string) => CultureDeck | undefined;

  // Step operations
  addStep: (deckId: string, step: Step) => boolean;
  updateStep: (deckId: string, stepIndex: number, step: Step) => boolean;
  removeStep: (deckId: string, stepIndex: number) => boolean;
  moveStepUp: (deckId: string, stepIndex: number) => boolean;
  moveStepDown: (deckId: string, stepIndex: number) => boolean;

  // Import/Export
  importData: (json: string) => { success: boolean; message: string };
  exportDeck: (id: string) => string | null;
  exportAll: () => string;
  clearAll: () => void;

  // Stats
  stats: {
    decks: number;
    steps: number;
  };
}

const STORAGE_KEY = 'dzardzongke-culture';

const CultureContext = createContext<CultureContextValue | undefined>(undefined);

export function CultureProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<CultureDataManager>(new CultureDataManager([]));

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.decks)) {
          setManager(new CultureDataManager(parsed.decks));
        }
      }
    } catch (err) {
      console.error('Failed to load culture data:', err);
      setManager(new CultureDataManager([]));
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveData = useCallback((newManager: CultureDataManager) => {
    setManager(newManager);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks: newManager.decks }));
    } catch (err) {
      console.error('Failed to save culture data:', err);
    }
  }, []);

  // Deck operations
  const addDeck = useCallback((id: string, title: string): CultureDeck | null => {
    const deck = createCultureDeck(id, title, []);
    const newManager = manager.clone();
    if (newManager.addDeck(deck)) {
      saveData(newManager);
      return deck;
    }
    return null;
  }, [manager, saveData]);

  const updateDeck = useCallback((id: string, title: string): boolean => {
    const newManager = manager.clone();
    const result = newManager.updateDeck(id, { title });
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const removeDeck = useCallback((id: string) => {
    const newManager = manager.clone();
    newManager.removeDeck(id);
    saveData(newManager);
  }, [manager, saveData]);

  const getDeck = useCallback((id: string) => {
    return manager.getDeck(id);
  }, [manager]);

  // Step operations
  const addStep = useCallback((deckId: string, step: Step): boolean => {
    const newManager = manager.clone();
    const result = newManager.addStep(deckId, step);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const updateStep = useCallback((deckId: string, stepIndex: number, step: Step): boolean => {
    const newManager = manager.clone();
    const result = newManager.updateStep(deckId, stepIndex, step);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const removeStep = useCallback((deckId: string, stepIndex: number): boolean => {
    const newManager = manager.clone();
    const result = newManager.removeStep(deckId, stepIndex);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const moveStepUp = useCallback((deckId: string, stepIndex: number): boolean => {
    const newManager = manager.clone();
    const result = newManager.moveStepUp(deckId, stepIndex);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const moveStepDown = useCallback((deckId: string, stepIndex: number): boolean => {
    const newManager = manager.clone();
    const result = newManager.moveStepDown(deckId, stepIndex);
    if (result) saveData(newManager);
    return result;
  }, [manager, saveData]);

  // Import/Export
  const importData = useCallback((json: string): { success: boolean; message: string } => {
    const newManager = manager.clone();
    const result = newManager.importFromJSON(json);
    if (result.success) saveData(newManager);
    return result;
  }, [manager, saveData]);

  const exportDeck = useCallback((id: string): string | null => {
    return manager.exportDeck(id);
  }, [manager]);

  const exportAll = useCallback((): string => {
    return manager.exportAll();
  }, [manager]);

  const clearAll = useCallback(() => {
    saveData(new CultureDataManager([]));
  }, [saveData]);

  const stats = manager.getStats();

  return (
    <CultureContext.Provider
      value={{
        decks: manager.decks,
        addDeck,
        updateDeck,
        removeDeck,
        getDeck,
        addStep,
        updateStep,
        removeStep,
        moveStepUp,
        moveStepDown,
        importData,
        exportDeck,
        exportAll,
        clearAll,
        stats,
      }}
    >
      {children}
    </CultureContext.Provider>
  );
}

export function useCulture(): CultureContextValue {
  const context = useContext(CultureContext);
  if (!context) {
    throw new Error('useCulture must be used within a CultureProvider');
  }
  return context;
}
