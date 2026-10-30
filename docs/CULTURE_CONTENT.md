# Adding Culture Content (Non-Technical Guide)

This guide explains how to add Culture content (text, images, quizzes) for **any language**, without touching screen code. UI wiring is automatic once content is in place.

## Where to edit

- Images: `assets/images/culture/`
- Deck files: `assets/culture/{lang}/deck-*.json` (replace `{lang}` with your language code, e.g. `dz`, `qu`)

You only ever need to touch these two places for day-to-day content work.

## Image rules

- PNG or JPG files in `assets/images/culture/` (e.g. `culture10.png`).
- Short, simple filenames, no spaces.
- Landscape orientation recommended, ≥1600px wide for a good look.

## Content structure

Each deck is a JSON file inside `assets/culture/{lang}/`, e.g.:
- `deck-1.json`: Language & Region overview
- `deck-2.json`: A festival or tradition

Each deck has a list of `steps`. A step can be:
- `text` — a paragraph card
- `image` — an image with a caption
- `quiz-single` — multiple choice, one correct answer
- `quiz-multi` — multiple choice, multiple correct answers

## Adding a brand-new deck (step by step)

This creates a new tab in the Culture screen.

1. **Add images (optional)**
   Put them in `assets/images/culture/` — e.g. `culture10.png`.
   Because of how the app bundles images, each new filename needs to be registered once (next step).

2. **Register the filename (one-time per new file)**
   Open `app/screens/CultureDynamic.tsx`, find `imageMap` near the top, and add a line:
   ```ts
   const imageMap: Record<string, any> = {
     // existing lines...
     'culture10.png': require('../../assets/images/culture/culture10.png'),
   };
   ```

3. **Create or edit the deck JSON**
   Duplicate an existing file under `assets/culture/{lang}/` (e.g. copy `deck-1.json` to `deck-3.json`), update `id`, `title`, and `steps`, then register the new file in `app/content/loadCulture.ts` with a `require` line so the app loads it.

## Interactive Map (StoryMapJS)

The Culture screen can embed a StoryMapJS link under an "Interactive Map" tab. Maps are set per language in `apps/mobile-app/assets/culture/maps.json` (`{ "<lang>": "https://…" }`); languages without an entry get no map tab. Renders as an `<iframe>` on web and a `WebView` on iOS/Android — use a public HTTPS URL, or ensure access if private.

## Example: text + image + quiz

```ts
steps: [
  { type: 'text', text: 'Write your paragraph here.' },
  { type: 'image', src: 'culture10.png', caption: 'Your caption text' },
  {
    type: 'quiz-single',
    question: 'Your question?',
    options: [
      { label: 'Option A', correct: false },
      { label: 'Option B', correct: true },
    ],
  },
];
```
Make sure `culture10.png` exists in `assets/images/culture/` and is registered in `imageMap`.

## Quiz answer reveal

Correctness is hidden until the learner presses "Check answer(s)." Multi-select quizzes let the learner pick several options before checking.

## Do I need a backend?

No — culture content ships bundled with the app. If you later want server-driven content, the same schema can be fetched from a URL with no UI changes needed.

## Tips

- One paragraph per `text` step, for pacing.
- Keep captions short.
- Consistent filenames: `culture<number>.png`.

## Troubleshooting

- Image not showing → confirm the path (`assets/images/culture/<filename>`) and that `src` matches the filename exactly, including case.
- Stale bundle → restart with `npx expo start -c`.

## Build & Run (Localhost)

- `npm install`, then `npx expo start` and choose your target (web/iOS/Android), or scan the QR in Expo Go.

## Release & Updates (Android/iOS)

- Update versions in `app.json` as needed.
- Android APK (quick review/share): `eas build -p android --profile preview`
- Android Play Store: `eas build -p android --profile production` → `eas submit -p android`
- iOS TestFlight/App Store: `eas build -p ios --profile production` → `eas submit -p ios`
