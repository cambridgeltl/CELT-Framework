#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

const {
  GOOGLE_API_KEY,
  DECKS_SHEET_ID,
  DICTIONARY_SHEET_ID,
  CULTURE_SHEET_ID,
  LANG = 'dz',
  LANG_NAME,
} = process.env;

if (!GOOGLE_API_KEY) {
  console.error('Missing GOOGLE_API_KEY environment variable');
  process.exit(1);
}

interface RowObject {
  [key: string]: string;
}

async function fetchSheet(spreadsheetId: string, range: string): Promise<RowObject[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch range ${range} from sheet ${spreadsheetId}`);
  }
  const data = await res.json();
  const [headers, ...rows] = data.values as string[][];
  return rows.map((row) => {
    const obj: RowObject = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
}

async function writeJSON(relativePath: string, data: unknown) {
  const filePath = path.join(process.cwd(), relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${relativePath}`);
}

/**
 * Register LANG's human-readable name in assets/languages.json, so the app shows
 * "French" instead of just "FR" — without touching any app code. Merges with
 * whatever's already registered for other languages; only runs when LANG_NAME is set.
 */
async function updateLanguageRegistry() {
  if (!LANG_NAME) return;
  const registryPath = path.join(process.cwd(), 'assets/languages.json');
  let registry: Record<string, string> = {};
  try {
    registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  } catch {
    // No existing registry yet — start a fresh one.
  }
  registry[LANG] = LANG_NAME;
  await writeJSON('assets/languages.json', registry);
}

/**
 * Group flat "Decks" sheet rows (one row per card, repeated id/title/description
 * per deck) into proper Deck objects matching assets/decks/deck.schema.json.
 */
function groupDecks(rows: RowObject[]): Array<{
  id: string;
  title: string;
  description: string;
  lang: string;
  cards: Array<{ id: string; front: string; back: string; image?: string; audio?: string; hasAudio: boolean }>;
}> {
  const deckMap = new Map<string, ReturnType<typeof groupDecks>[number]>();
  rows.forEach((row) => {
    const deckId = row.id;
    if (!deckId) return;
    if (!deckMap.has(deckId)) {
      deckMap.set(deckId, {
        id: deckId,
        title: row.title || deckId,
        description: row.description || '',
        lang: LANG,
        cards: [],
      });
    }
    deckMap.get(deckId)!.cards.push({
      id: row.cardId || `${deckId}-${deckMap.get(deckId)!.cards.length + 1}`,
      front: row.front || '',
      back: row.back || '',
      image: row.image || undefined,
      audio: row.audio || undefined,
      hasAudio: !!row.audio,
    });
  });
  return Array.from(deckMap.values());
}

async function run() {
  if (DECKS_SHEET_ID) {
    const rows = await fetchSheet(DECKS_SHEET_ID, 'Decks');
    const decks = groupDecks(rows);
    for (const deck of decks) {
      await writeJSON(`assets/decks/${LANG}-${deck.id}.json`, deck);
    }
  }

  if (DICTIONARY_SHEET_ID) {
    const rows = await fetchSheet(DICTIONARY_SHEET_ID, 'Dictionary');
    const dictionary = {
      lang: LANG,
      entries: rows.map((row) => ({
        dz: row.word,
        en: row.en,
        example: row.example,
        exampleEn: row.exampleEn,
        audio: row.audio || undefined,
      })),
    };
    await writeJSON(`assets/dictionary/${LANG}.dict.json`, dictionary);
  }

  if (CULTURE_SHEET_ID) {
    const rows = await fetchSheet(CULTURE_SHEET_ID, 'Culture');
    const sorted = [...rows].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const steps = sorted.map((row) => {
      switch (row.type) {
        case 'image':
          return { type: 'image', header: row.title || undefined, src: row.image, caption: row.caption || '' };
        case 'quiz-single':
        case 'quiz-multi':
          // Flat spreadsheet rows can't represent a multi-option quiz question;
          // author these directly as JSON (see docs/CULTURE_CONTENT.md) instead of via Sheets.
          console.warn(`Skipping unsupported culture row type "${row.type}" — quiz steps must be authored as JSON.`);
          return null;
        case 'text':
        default:
          return { type: 'text', header: row.title || undefined, text: row.text || '' };
      }
    }).filter(Boolean);

    const culture = { id: `${LANG}-culture`, title: 'Culture', steps };
    await writeJSON(`assets/culture/${LANG}/culture.json`, culture);
  }

  await updateLanguageRegistry();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
