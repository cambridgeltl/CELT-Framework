# 📚 Content Management Workflow for Non-Technical Contributors

This guide explains how to manage app content using **Google Sheets** — no coding required. You can edit decks, dictionary entries, and culture content directly in a familiar spreadsheet, then push them into the app with one command.

This workflow works for **any language**. Wherever you see `{lang}`, substitute your language's short code (e.g. `dz`, `qu`, `en`) — the same code you use elsewhere in the app (folder names, content registry, etc).

## 🚀 Quick Start

1. **Get Google API access** (one-time setup)
2. **Create your content spreadsheet** (one-time setup)
3. **Edit content** in Google Sheets
4. **Export to the app** with one command
5. **Test changes** locally
6. **Deploy**

---

## 🔑 Step 1: Get Google API Access

### What is a Google API key?
It's a credential that lets the export script read your Google Sheet. It's free and doesn't grant write access to anything else.

### How to get one:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and sign in.
2. **Create a new project** (or select an existing one) — name it something like "`{Your Language}` Content Manager".
3. **Enable the Google Sheets API**: left menu → "APIs & Services" → "Library" → search "Google Sheets API" → Enable.
4. **Create an API key**: "APIs & Services" → "Credentials" → "Create Credentials" → "API Key". Copy the string (starts with `AIza...`) and save it somewhere safe.
5. **Restrict the key** (recommended): open the key → "Application restrictions" → "Restrict key" → "API restrictions" → restrict to Google Sheets API → Save.

---

## 📊 Step 2: Create Your Content Spreadsheet

### Fastest option: copy the template

Use the [ready-made template spreadsheet](https://docs.google.com/spreadsheets/d/1fHszqprHlFWjYB4378gJA3_CDaC_jNog51gbhicNaqA/edit?usp=sharing) — it already has the 3 tabs (`Decks`, `Dictionary`, `Culture`) with the correct headers and an example row in each.

1. Open the link above.
2. **File → Make a copy** (don't edit the shared original — everyone using this link works from their own copy).
3. Rename your copy to something like "`{Your Language}` Content".
4. Delete the yellow example row in each tab before adding your own rows.
5. Share **your copy** as "anyone with the link can view" (the setting doesn't carry over from the original).

### Or start from scratch

1. Go to [Google Sheets](https://sheets.google.com) and create a blank spreadsheet.
2. Name it something like "`{Your Language}` Content".
3. Create **3 tabs** with these exact names:
   - `Decks` — flashcard decks
   - `Dictionary` — word definitions
   - `Culture` — culture content
4. Share the sheet as "anyone with the link can view."

**Get your Spreadsheet ID:** it's the long string in the URL between `/d/` and `/edit`:
`https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`

---

## 📋 Step 3: Spreadsheet Structure

### Decks tab

`front` is the English prompt shown first; `back` is the target-language answer revealed when the card is flipped.

| id | title | description | difficulty | cardId | front | back | image | audio |
|----|-------|-------------|------------|--------|-------|------|-------|-------|
| animals-basic | Animals | Basic animal names | beginner | 1 | bird | *(word in your language)* | bird.png | bird.mp3 |
| animals-basic | Animals | Basic animal names | beginner | 2 | dog | *(word in your language)* | dog.png | dog.mp3 |

- **Add a deck**: new row(s) with a unique `id`.
- **Add cards**: new rows sharing the same `id`, different `cardId`.
- **Remove a card**: delete the row.

### Dictionary tab

| word | en | example | exampleEn | audio | difficulty |
|------|----|---------|-----------|-------|------------|
| *(target-language word)* | bird | *(example sentence)* | small bird | bird.mp3 | beginner |

- `word` is whatever you're teaching; `en` is the English gloss (or swap for your reference language).
- In the exported JSON the word is stored as `dz` for backwards compatibility; the app also accepts `word`. Conversation files likewise accept `target` as well as the older `dzardzongke` key.
- Add/remove rows to add/remove entries; edit any cell to update a translation.

### Culture tab

`type` must be exactly `text` or `image` — these are the only step types the export script can generate from flat rows.

| type | title | text | image | caption | order |
|------|-------|------|-------|---------|-------|
| text | Welcome | Welcome to {language} culture! | | | 1 |
| image | Origins | | origins.png | Historical origins | 2 |

- **New step**: new row. Rows become steps in a single "Culture" lesson, in `order`.
- **Reorder**: change the `order` number.
- Quiz steps (`quiz-single`/`quiz-multi`) aren't supported from Sheets — add those by hand in the exported JSON file (see `docs/CULTURE_CONTENT.md`).

---

## 🖼️ Step 4: Images & Audio

### Images: still added manually
Images go in `assets/images/` and must be committed to the repo directly — Sheets only stores the filename reference, not the file itself.

### Audio: automatic mapping
Audio registration is automatic. You don't touch any code.

1. Place audio files in the correct folder (see structure below).
2. Run: `npm run map-audio`
3. Done — mappings are generated for you.

```
assets/audio/
├── dictionary_words/        # Dictionary pronunciations
│   ├── word-meaning.wav
│   └── another-word.mp3
├── conversations/           # Conversation audio
│   └── {category}/{conversation}/
│       ├── 1_A.wav
│       └── 1_B.wav
└── other_audio/
```

**Naming rules:**
- Lowercase, hyphen-separated: `bird-image.png`, not `bird_image.png`.
- Supported formats: `.png`, `.jpg`, `.wav`, `.mp3`, `.m4a`, `.aac`.
- Dictionary audio files: `word-meaning.wav` (part before the first hyphen becomes the lookup key).
- Conversation audio: `{sequence}_{speaker}.wav`, e.g. `1_A.wav`, `2_B.wav`.

---

## ⚙️ Step 5: Environment Variables

Create a `.env` file in the project root of `apps/mobile-app`:

```bash
GOOGLE_API_KEY=AIzaSy...your-api-key-here
DECKS_SHEET_ID=...your-spreadsheet-id
DICTIONARY_SHEET_ID=...your-spreadsheet-id
CULTURE_SHEET_ID=...your-spreadsheet-id
LANG=de          # your language's short code — defaults to "dz" if omitted
LANG_NAME=German # the human-readable name shown in the app (Settings, Onboarding, etc.)
```

(Mac/Linux/Windows shell `export`/`set` also work if you prefer not to use a file — see your shell's docs.)

Each language gets its own spreadsheet and its own `LANG` value — run the export once per language. The app discovers every language that has content automatically; there's no separate registration step.

`LANG_NAME` only needs to be set once per language — it's written to `assets/languages.json` (a simple `{"code": "Display Name"}` map) and merged with whatever's already registered for other languages. Omit it on later runs for the same language; without it (and with no existing entry), the app just shows the uppercased code (e.g. `FR`) until a name is registered — you can also add one by hand by editing `assets/languages.json` directly.

---

## 📤 Step 6: Export Content to the App

After editing your Google Sheet:

```bash
npm run export-content
```

If you added new audio files, also run:

```bash
npm run map-audio
```

Expected output:

```
Wrote assets/decks/{lang}-{deck-id}.json   (one file per deck)
Wrote assets/dictionary/{lang}.dict.json
Wrote assets/culture/{lang}/culture.json
Wrote assets/languages.json                (only if LANG_NAME was set)
```

Every exported file is tagged with `"lang": "{lang}"` — that's how the app knows which language it belongs to. You never need to touch the content-loading code to add a new language; the app discovers whatever `lang` values show up in `assets/`.

> **Culture quiz steps**: the Culture tab only supports plain text/image steps (a `type` of `text` or `image`) — a flat spreadsheet row can't represent a multi-option quiz question. To add `quiz-single`/`quiz-multi` steps, author the culture JSON file directly (see `docs/CULTURE_CONTENT.md`) instead of via Sheets.

---

## 🧪 Step 7: Test Locally

```bash
npm start
# or
npx expo start
```

Open the app and check: new cards appear, images load, audio plays, text is correct.

**Common issues:**
- Images not showing → check filename spelling matches exactly (case-sensitive on Android/EAS builds).
- Audio not playing → confirm the file exists in `assets/audio/` and re-run `npm run map-audio`.
- Content missing → check the Sheet for typos in `id`/`type` columns.
- Export errors → check API key and Spreadsheet ID.

---

## 🚀 Step 8: Deploy

```bash
git add .
git commit -m "Update content: add new deck"
git push origin main
```

Then trigger a build (see the main README for the GitHub Actions APK build, or `eas build` for iOS/Android app store builds).

---

## 📝 Complete Example: Adding a New "Food" Deck

1. **Decks tab** — add rows:
   ```
   food-basic | Food | Basic food names | beginner | 1 | rice | (word) | rice.png | rice.mp3
   food-basic | Food | Basic food names | beginner | 2 | meat | (word) | meat.png | meat.mp3
   ```
2. **Add files**: `rice.png`, `meat.png` → `assets/images/`; `rice.mp3`, `meat.mp3` → `assets/audio/`.
3. **Export**: `npm run export-content`
4. **Map audio**: `npm run map-audio`
5. **Test**: `npm start`
6. **Deploy**: commit, push, build.

---

## 🆘 Troubleshooting

| Problem | Fix |
|---|---|
| Export fails | Check API key, Spreadsheet ID, sheet sharing settings, internet connection |
| Images not showing | Verify filename matches exactly; lowercase + hyphens only |
| Content not updating | Re-run `npm run export-content`; restart dev server |
| Audio not working | Re-run `npm run map-audio`; check format is supported |

---

## 📚 Summary

You can, without writing code:
- ✅ Add/remove/edit flashcard decks
- ✅ Manage dictionary words
- ✅ Update culture content
- ✅ Add entirely new content sections for a new language

**Remember:**
- Image files still need to be added to the repo manually.
- Always test locally before deploying.
- Keep your API key and Spreadsheet ID private.
- Run `npm run export-content` (and `npm run map-audio` if needed) after every content change.
