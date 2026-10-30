import { Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = Platform.OS === 'web' ? require('./sqlite.web') : require('./sqlite.native');

/** Minimal subset of the expo-sqlite API used by the app (implemented by both platforms). */
export interface AppDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null | undefined>;
}

export const openDb: () => Promise<AppDb> = impl.openDb;


