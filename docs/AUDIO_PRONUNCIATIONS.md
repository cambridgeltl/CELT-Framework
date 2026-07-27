# Adding Audio Pronunciations

This guide explains how to add audio for dictionary entries and conversation messages, for **any language** loaded into the app.

## Audio File Requirements

- **Formats supported**: `.wav`, `.mp3`, `.m4a`, `.aac`
- **Size**: keep clips small (under ~100–150KB) for app performance
- **Quality**: 128kbps MP3 is a good size/quality balance; WAV is also fully supported
- **Naming**: lowercase, hyphens instead of spaces — the filename is the lookup key

## Dictionary Audio

### Step 1: Add the audio file
Place it in `assets/audio/dictionary_words/`, named after the word (e.g. `hello.wav`, `thank-you.wav`). For words with spaces, use hyphens or underscores consistently.

### Step 2: Reference it in the dictionary entry
In `assets/dictionary/{lang}.dict.json`:

```json
{
  "word": "hello",
  "en": "hello",
  "example": "",
  "exampleEn": "",
  "audio": "hello.wav"
}
```

### Step 3: Run the auto-mapper — no manual code required
```bash
npm run map-audio
```
This scans `assets/audio/` and generates all the necessary mappings automatically. You do **not** need to hand-edit `AudioService.ts` or similar files.

### Step 4: Test
Rebuild/restart the app, open the dictionary, search for the word, and tap the sound icon.

## Conversation Audio

- Location: `assets/audio/conversations/{category}/{conversation}/`
- Naming: `{sequence}_{speaker}.(wav|mp3)` — sequence starts at 1 and matches message order; speaker is `A` or `B`.
- Example: `assets/audio/conversations/greetings/lesson1/1_A.mp3`

```
assets/audio/
├── dictionary_words/
│   ├── hello.wav
│   └── thank-you.wav
├── conversations/
│   ├── greetings/
│   │   ├── lesson1/
│   │   │   ├── 1_A.wav
│   │   │   └── 1_B.wav
│   │   └── lesson2/
│   └── family/
└── other_audio/
```

### How playback is triggered
The app computes a lookup key of the form `conv/{lang}/{category}/{conversation}/{sequence}_{speaker}` and auto-plays it when a message appears, if a matching file was registered. Each message also has a replay button.

### Adding a new conversation category or conversation
1. Author the conversation (ordered exchanges, `speaker: 'A'|'B'`) via the data-creator web app or directly in Google Sheets.
2. Drop matching audio files into `assets/audio/conversations/{category}/{conversation}/`.
3. Run `npm run map-audio`.
4. Run the app — playback and replay work automatically.

## Batch Adding Audio

1. Drop all files into the correct folders.
2. Update dictionary/conversation content with the `audio` field where needed.
3. Run `npm run map-audio` once — it registers everything in one pass.

## Troubleshooting

- Audio doesn't play → confirm the filename in the JSON matches the actual file exactly (case-sensitive).
- Still nothing → re-run `npm run map-audio` and restart the dev server.
- Web builds may block autoplay until the user interacts once (browser policy) — the manual replay button always works.
- Keep clips lightweight; large files slow down bundling and app size.

## Build & Run (Localhost)

- `npm install`
- `npx expo start` — choose web (`w`), iOS (`i`), Android (`a`), or scan the QR code in Expo Go.

## Release & Updates (Android/iOS)

- Bump `expo.version` in `app.json` (and `ios.buildNumber` / `android.versionCode` as needed).
- Android APK (quick share): `eas build -p android --profile preview`
- Android Play Store: `eas build -p android --profile production` → `eas submit -p android`
- iOS TestFlight/App Store: `eas build -p ios --profile production` → `eas submit -p ios`
