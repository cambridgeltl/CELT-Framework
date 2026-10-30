import * as SQLite from 'expo-sqlite';
import type { EventStore } from './eventStore';
import type { AnalyticsRecord } from './events';

export function createSqliteStore(): EventStore {
  let dbPromise: Promise<import('expo-sqlite').SQLiteDatabase> | null = null;
  const db = () => {
    if (!dbPromise) {
      dbPromise = SQLite.openDatabaseAsync('analytics.db').then(async (d) => {
        await d.execAsync(`
          CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            ts INTEGER NOT NULL,
            json TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
        `);
        return d;
      });
    }
    return dbPromise;
  };
  return {
    async append(records) {
      const d = await db();
      await d.withTransactionAsync(async () => {
        for (const r of records) {
          await d.runAsync('INSERT OR IGNORE INTO events (id, ts, json) VALUES (?, ?, ?);', [r.id, r.ts, JSON.stringify(r)]);
        }
      });
    },
    async all() {
      const d = await db();
      const rows = await d.getAllAsync<{ json: string }>('SELECT json FROM events ORDER BY ts ASC;');
      return rows.map((row) => JSON.parse(row.json) as AnalyticsRecord);
    },
    async count() {
      const d = await db();
      const row = await d.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM events;');
      return row?.n ?? 0;
    },
  };
}
