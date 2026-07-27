# Quiz Images Guide

You can show an optional illustration on multiple-choice quiz items, for any language. The UI scales images automatically.

## TL;DR

- Put your image under `assets/images/quiz/` (e.g. `horse.png`).
- Map a prompt to an image via the data-creator web app, or directly in the Decks tab of Google Sheets, using the `image` column.
- Build/run locally — the image shows on the quiz card for that prompt.

## Steps

1. **Add your image file**
   - Path: `assets/images/quiz/`
   - Naming: lowercase, hyphen-separated (e.g. `horse.png`, `two-birds.png`)
   - Format: PNG or WebP recommended
   - Size: square, ~256–512px, under 100KB where possible

2. **Register the mapping**
   - In your content source (Google Sheets Decks tab, or the data-creator app), add/update a row:
     - `id`: quiz-deck-name
     - `front`: prompt text in the target language
     - `back`: answer (e.g. in English)
     - `image`: filename, e.g. `horse.png`
   - The filename must match exactly what's in `assets/images/quiz/`.

3. **Verify in the app**
   - Run locally, open the Multiple Choice screen, and navigate to the prompt — the image should appear above/below the prompt card, properly contained.

## Notes

- Images are optional — quizzes without a mapping render text-only.
- The same image can be reused across multiple prompts/languages if it fits (e.g. an illustration of a horse works for any language's word for "horse").
- Keep images lightweight for mobile performance.

## Build & Run (Localhost)

- `npm install` then `npx expo start`
- Press `w` (web), `i` (iOS), `a` (Android), or scan the QR in Expo Go.

## Release & Updates (Android/iOS)

- Bump versions in `app.json` as needed.
- Android APK (quick share): `eas build -p android --profile preview`
- Android Play Store: `eas build -p android --profile production` → `eas submit -p android`
- iOS TestFlight/App Store: `eas build -p ios --profile production` → `eas submit -p ios`
