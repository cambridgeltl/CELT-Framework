import { Platform } from 'react-native';
import { getAllEvents, getParticipantAliases, getParticipantCode, track, flush } from './analytics';

export const EXPORT_FORMAT = 'celt-analytics-v1';

export async function buildExport() {
  const events = await getAllEvents();
  const participants = Array.from(new Set(events.map((e) => e.participant)));
  return {
    format: EXPORT_FORMAT,
    exported_at: new Date().toISOString(),
    exported_by_participant: getParticipantCode(),
    participants,
    /** Earlier codes that a facilitator replaced, e.g. { "anon-7k3q9x": "PUNO-07" }. */
    participant_aliases: await getParticipantAliases(),
    event_count: events.length,
    events,
  };
}

/**
 * Export every event stored on this device (all accounts) as one JSON file.
 * Android/iOS: opens the share sheet (WhatsApp, email, Bluetooth, Drive…).
 * Web: downloads the file.
 */
export async function exportResearchData(): Promise<{ eventCount: number; fileName: string }> {
  const data = await buildExport();
  const stamp = data.exported_at.slice(0, 16).replace(/[:T]/g, '-');
  const fileName = `celt-analytics-${getParticipantCode()}-${stamp}.json`;
  const json = JSON.stringify(data);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require('expo-file-system') as typeof import('expo-file-system');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require('expo-sharing') as typeof import('expo-sharing');
    const uri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Send research data' });
    } else {
      throw new Error('Sharing is not available on this device.');
    }
  }

  track('research_data_exported', { event_count: data.event_count });
  await flush();
  return { eventCount: data.event_count, fileName };
}
