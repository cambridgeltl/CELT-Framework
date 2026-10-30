import { Platform } from 'react-native';
import type { AnalyticsRecord } from './events';

/**
 * Append-only, offline event log.
 * - iOS / Android: SQLite table in its own database (analytics.db), survives restarts.
 * - Web: localStorage (capped), falling back to memory where storage is unavailable.
 */
export interface EventStore {
  append(records: AnalyticsRecord[]): Promise<void>;
  all(): Promise<AnalyticsRecord[]>;
  count(): Promise<number>;
}

const WEB_KEY = 'research_events_v1';
const WEB_MAX_EVENTS = 20000;

function createWebStore(): EventStore {
  let memory: AnalyticsRecord[] = [];
  const hasLocalStorage = (() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch {
      return false;
    }
  })();
  const read = (): AnalyticsRecord[] => {
    if (!hasLocalStorage) return memory;
    try {
      return JSON.parse(localStorage.getItem(WEB_KEY) || '[]');
    } catch {
      return [];
    }
  };
  const write = (rows: AnalyticsRecord[]) => {
    const trimmed = rows.length > WEB_MAX_EVENTS ? rows.slice(rows.length - WEB_MAX_EVENTS) : rows;
    if (!hasLocalStorage) {
      memory = trimmed;
      return;
    }
    try {
      localStorage.setItem(WEB_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage full: keep the newest half so logging continues.
      localStorage.setItem(WEB_KEY, JSON.stringify(trimmed.slice(Math.floor(trimmed.length / 2))));
    }
  };
  return {
    async append(records) {
      write([...read(), ...records]);
    },
    async all() {
      return read();
    },
    async count() {
      return read().length;
    },
  };
}

// Platform-specific file: sqliteEventStore.native.ts on iOS/Android, sqliteEventStore.ts (stub) on web,
// so expo-sqlite (and its web worker/wasm) is never bundled into the web build.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createSqliteStore } = require('./sqliteEventStore') as { createSqliteStore: () => EventStore };

/** Uses SQLite on native; if SQLite can't be opened (or on web), falls back to the web/memory store. */
function createStore(): EventStore {
  if (Platform.OS === 'web') return createWebStore();
  let active: EventStore | null = null;
  const resolve = async (): Promise<EventStore> => {
    if (active) return active;
    const sqlite = createSqliteStore();
    try {
      await sqlite.count();
      active = sqlite;
    } catch {
      active = createWebStore();
    }
    return active;
  };
  return {
    append: async (records) => (await resolve()).append(records),
    all: async () => (await resolve()).all(),
    count: async () => (await resolve()).count(),
  };
}

export const eventStore: EventStore = createStore();
