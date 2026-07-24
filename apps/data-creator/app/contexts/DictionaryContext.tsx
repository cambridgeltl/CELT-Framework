'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dictionary, Entry } from '../models/Dictionary';

interface DictionaryContextValue {
  // Dictionary state
  dictionary: Dictionary;
  entries: Entry[];

  // Actions
  addEntry: (entry: Entry) => boolean;
  updateEntry: (oldDz: string, entry: Entry) => boolean;
  removeEntry: (dz: string) => boolean;
  clearEntries: () => void;
  importEntries: (newEntries: Entry[]) => number;

  // Helpers
  getEntry: (dz: string) => Entry | undefined;
  getEntryCount: () => number;
  toJSONString: () => string;
  downloadJSON: (fileName: string) => void;
}

const DictionaryContext = createContext<DictionaryContextValue | undefined>(undefined);

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const [dictionary, setDictionary] = useState<Dictionary>(new Dictionary());

  const addEntry = useCallback((entry: Entry): boolean => {
    if (!entry.isValid()) {
      return false;
    }

    setDictionary(prev => {
      // Check if entry already exists
      if (prev.getEntry(entry.dz)) {
        return prev;
      }
      const newDict = new Dictionary([...prev.getAllEntries(), entry]);
      return newDict;
    });

    // Check if the entry was actually added
    return !dictionary.getEntry(entry.dz);
  }, [dictionary]);

  const updateEntry = useCallback((oldDz: string, entry: Entry): boolean => {
    if (!entry.isValid()) {
      return false;
    }

    setDictionary(prev => {
      const entries = prev.getAllEntries().filter(e => e.dz !== oldDz);
      return new Dictionary([...entries, entry]);
    });

    return true;
  }, []);

  const removeEntry = useCallback((dz: string): boolean => {
    setDictionary(prev => {
      const entries = prev.getAllEntries().filter(e => e.dz !== dz);
      return new Dictionary(entries);
    });
    return true;
  }, []);

  const clearEntries = useCallback(() => {
    setDictionary(new Dictionary());
  }, []);

  const importEntries = useCallback((newEntries: Entry[]): number => {
    let added = 0;
    setDictionary(prev => {
      const existingEntries = prev.getAllEntries();
      const existingDzWords = new Set(existingEntries.map(e => e.dz));
      const seenDzWords = new Set<string>();

      const entriesToAdd = newEntries.filter(entry => {
        // Check valid, not in existing entries, and not a duplicate within imported data
        if (entry.isValid() && !existingDzWords.has(entry.dz) && !seenDzWords.has(entry.dz)) {
          seenDzWords.add(entry.dz);
          added++;
          return true;
        }
        return false;
      });

      return new Dictionary([...existingEntries, ...entriesToAdd]);
    });
    return added;
  }, []);

  const getEntry = useCallback((dz: string): Entry | undefined => {
    return dictionary.getEntry(dz);
  }, [dictionary]);

  const getEntryCount = useCallback((): number => {
    return dictionary.getEntryCount();
  }, [dictionary]);

  const toJSONString = useCallback((): string => {
    return dictionary.toJSONString();
  }, [dictionary]);

  const downloadJSON = useCallback((fileName: string): void => {
    dictionary.downloadJSON(fileName);
  }, [dictionary]);

  const entries = dictionary.getAllEntries();

  return (
    <DictionaryContext.Provider
      value={{
        dictionary,
        entries,
        addEntry,
        updateEntry,
        removeEntry,
        clearEntries,
        importEntries,
        getEntry,
        getEntryCount,
        toJSONString,
        downloadJSON,
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary(): DictionaryContextValue {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}
