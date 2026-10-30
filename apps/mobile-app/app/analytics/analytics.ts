import Constants from 'expo-constants';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as SecureStore from '../../lib/utils/secureStore';
import type { AnalyticsEventName, AnalyticsEvents, AnalyticsRecord } from './events';
import { eventStore } from './eventStore';

/**
 * Research analytics: an offline-first, append-only event log.
 *
 * Nothing is sent anywhere. Events stay on the device until a facilitator exports
 * them from Settings → Research (see exportResearchData.ts). Each event carries the
 * anonymous participant code, session id, language, app version, platform and
 * online status, so the exported file can be analysed on its own.
 */

const PARTICIPANTS_KEY = 'research_participants_v1';
const ALIASES_KEY = 'research_participant_aliases_v1';
const FLUSH_DELAY_MS = 1500;

type Context = {
  user: string | null;
  participant: string;
  session: string | null;
  sessionStartedAt: number | null;
  screensInSession: number;
  lang: string | null;
  online: boolean | null;
  screen: string | null;
  screenSince: number | null;
};

const ctx: Context = {
  user: null,
  participant: 'unassigned',
  session: null,
  sessionStartedAt: null,
  screensInSession: 0,
  lang: null,
  online: null,
  screen: null,
  screenSince: null,
};

const appVersion: string = Constants.expoConfig?.version ?? 'unknown';
const platform = `${Platform.OS}${Platform.Version ? `-${Platform.Version}` : ''}`;

let pending: AnalyticsRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> = Promise.resolve();
let started = false;

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Short anonymous code, e.g. "anon-7k3q9x". Facilitators can replace it with the study code. */
function newAnonymousCode(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `anon-${s}`;
}

async function readParticipants(): Promise<Record<string, string>> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(PARTICIPANTS_KEY)) || '{}');
  } catch {
    return {};
  }
}

async function writeParticipants(map: Record<string, string>): Promise<void> {
  try {
    await SecureStore.setItemAsync(PARTICIPANTS_KEY, JSON.stringify(map));
  } catch {
    // best effort
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_DELAY_MS);
}

/** Write buffered events to storage. Safe to call often. */
export function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const batch = pending;
  pending = [];
  if (batch.length === 0) return flushing;
  flushing = flushing
    .then(() => eventStore.append(batch))
    .catch(() => {
      // Put the batch back so it is retried on the next flush.
      pending = [...batch, ...pending];
    });
  return flushing;
}

/** Record an event. Never throws; never blocks the UI. */
export function track<N extends AnalyticsEventName>(name: N, props: AnalyticsEvents[N]): void {
  try {
    const now = Date.now();
    pending.push({
      id: uuid(),
      ts: now,
      time: new Date(now).toISOString(),
      name,
      participant: ctx.participant,
      session: ctx.session,
      lang: ctx.lang,
      app_version: appVersion,
      platform,
      online: ctx.online,
      props: props as Record<string, unknown>,
    });
    scheduleFlush();
  } catch {
    // analytics must never break the app
  }
}

// ── Context setters ─────────────────────────────────────────────────────

export function setLanguage(lang: string): void {
  ctx.lang = lang;
}

export function setOnline(online: boolean | null): void {
  if (online === ctx.online) return;
  const changed = ctx.online !== null && online !== null;
  ctx.online = online;
  if (changed) track('network_changed', { online: !!online });
}

/** Called when the logged-in account changes. Each account on a shared device gets its own code. */
export async function setUser(user: string | null): Promise<void> {
  ctx.user = user;
  if (!user) {
    ctx.participant = 'unassigned';
    return;
  }
  const map = await readParticipants();
  if (!map[user]) {
    map[user] = newAnonymousCode();
    await writeParticipants(map);
  }
  ctx.participant = map[user];
}

export function getParticipantCode(): string {
  return ctx.participant;
}

/** Replace the current account's code with the study's participant code (e.g. "PUNO-07"). */
export async function setParticipantCode(code: string): Promise<string> {
  const clean = code.trim().replace(/\s+/g, '-').slice(0, 40);
  if (!clean || !ctx.user) return ctx.participant;
  const previous = ctx.participant;
  const map = await readParticipants();
  map[ctx.user] = clean;
  await writeParticipants(map);
  // Remember old → new so events logged under the anonymous code can be relabelled.
  if (previous && previous !== clean && previous !== 'unassigned') {
    const aliases = await getParticipantAliases();
    aliases[previous] = clean;
    for (const k of Object.keys(aliases)) if (aliases[k] === previous) aliases[k] = clean;
    try {
      await SecureStore.setItemAsync(ALIASES_KEY, JSON.stringify(aliases));
    } catch {
      // best effort
    }
  }
  ctx.participant = clean;
  track('participant_code_set', { participant: clean, previous });
  return clean;
}

/** Map of earlier participant codes to the code that replaced them on this device. */
export async function getParticipantAliases(): Promise<Record<string, string>> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(ALIASES_KEY)) || '{}');
  } catch {
    return {};
  }
}

// ── Sessions & screens ──────────────────────────────────────────────────

export function startSession(trigger: 'launch' | 'foreground'): void {
  if (ctx.session) return;
  ctx.session = uuid();
  ctx.sessionStartedAt = Date.now();
  ctx.screensInSession = 0;
  track('session_start', { trigger });
  // Re-log the current screen so every session has a first screen.
  if (ctx.screen) {
    const screen = ctx.screen;
    ctx.screen = null;
    trackScreen(screen);
  }
}

export function endSession(): void {
  if (!ctx.session || ctx.sessionStartedAt === null) return;
  track('session_end', { duration_ms: Date.now() - ctx.sessionStartedAt, screens_viewed: ctx.screensInSession });
  ctx.session = null;
  ctx.sessionStartedAt = null;
  void flush();
}

/** Log a screen change (consecutive duplicates are ignored). */
export function trackScreen(screen: string): void {
  if (!screen || screen === ctx.screen) return;
  const now = Date.now();
  const prev = ctx.screen;
  const prevDuration = ctx.screenSince !== null && prev ? now - ctx.screenSince : null;
  ctx.screen = screen;
  ctx.screenSince = now;
  track('screen_view', {
    screen,
    prev_screen: prev,
    prev_duration_ms: prevDuration,
    first_in_session: ctx.screensInSession === 0,
  });
  ctx.screensInSession += 1;
}

// ── Errors ──────────────────────────────────────────────────────────────

export function trackError(error: unknown, fatal: boolean, source: 'global' | 'render' | 'promise'): void {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  track('app_error', { message: message.slice(0, 500), fatal, source });
  if (fatal) void flush();
}

function installErrorHandlers() {
  const g = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler(): (e: unknown, isFatal?: boolean) => void;
      setGlobalHandler(h: (e: unknown, isFatal?: boolean) => void): void;
    };
    addEventListener?: (type: string, cb: (e: { error?: unknown; reason?: unknown; message?: string }) => void) => void;
  };
  if (Platform.OS !== 'web' && g.ErrorUtils) {
    const previous = g.ErrorUtils.getGlobalHandler();
    g.ErrorUtils.setGlobalHandler((e, isFatal) => {
      trackError(e, !!isFatal, 'global');
      previous?.(e, isFatal);
    });
  } else if (Platform.OS === 'web' && typeof g.addEventListener === 'function') {
    g.addEventListener('error', (e) => trackError(e.error ?? e.message, false, 'global'));
    g.addEventListener('unhandledrejection', (e) => trackError(e.reason, false, 'promise'));
  }
}

// ── Network ─────────────────────────────────────────────────────────────

function installNetworkListener() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Network = require('expo-network') as typeof import('expo-network');
    Network.getNetworkStateAsync()
      .then((s) => setOnline(s.isInternetReachable ?? s.isConnected ?? null))
      .catch(() => undefined);
    Network.addNetworkStateListener((s) => setOnline(s.isInternetReachable ?? s.isConnected ?? null));
  } catch {
    // expo-network unavailable (e.g. tests); online stays null
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────

/** Call once at app start. Sessions follow the app's foreground/background state. */
export function startAnalytics(): void {
  if (started) return;
  started = true;
  installErrorHandlers();
  installNetworkListener();
  startSession('launch');
  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') startSession('foreground');
    else endSession();
  });
}

// ── Reading data back ───────────────────────────────────────────────────

export async function getAllEvents(): Promise<AnalyticsRecord[]> {
  await flush();
  return eventStore.all();
}

export async function getEventCount(): Promise<number> {
  await flush();
  return eventStore.count();
}

/** Test helper: reset in-memory state. */
export function __resetForTests(): void {
  pending = [];
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  flushing = Promise.resolve();
  started = false;
  Object.assign(ctx, {
    user: null,
    participant: 'unassigned',
    session: null,
    sessionStartedAt: null,
    screensInSession: 0,
    lang: null,
    online: null,
    screen: null,
    screenSince: null,
  });
}
