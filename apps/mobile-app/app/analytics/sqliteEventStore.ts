import type { EventStore } from './eventStore';

/** Web / test stub: SQLite isn't used here; eventStore.ts falls back to localStorage/memory. */
export function createSqliteStore(): EventStore {
  const unavailable = async (): Promise<never> => {
    throw new Error('SQLite event store is only available on iOS/Android');
  };
  return { append: unavailable, all: unavailable, count: unavailable };
}
