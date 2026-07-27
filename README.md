# Language Learning Framework

A language-independent framework for building community language-learning apps. Anyone can load their own content (dictionary, flashcard decks, culture material) into the app without touching code, using a simple spreadsheet-style workflow.

This repo brings together two previously separate projects, plus a reference content pack:

```
lang-framework/
├── apps/
│   ├── mobile-app/       # The learner-facing app (Expo / React Native)
│   └── data-creator/     # The content-authoring web tool (Next.js)
├── content-packs/
│   └── dzardzongke/      # Reference example: a fully filled-in language
├── docs/                 # Non-technical guides for adding content
└── archive/              # (optional) old app code kept for reference
```

- **`apps/mobile-app`** is what learners install. It's language-agnostic — it renders whatever dictionary/decks/culture content is loaded into it.
- **`apps/data-creator`** is the low-barrier web tool for people without coding skills to author content and push it into `apps/mobile-app` via Google Sheets or a simple web form.
- **`content-packs/dzardzongke`** is a real, complete example (dictionary, decks, audio, culture content) — a working reference for what a finished language pack looks like.
- **`docs/`** has step-by-step, non-technical guides for content contributors — see below.

---

## 1. Prerequisites

Install once, on your machine:

- [Node.js](https://nodejs.org/) (LTS version) and npm
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — installed automatically via `npx` when needed, no separate global install required
- [EAS CLI](https://docs.expo.dev/eas/) for building installable apps: `npm install -g eas-cli`
- A free [Expo account](https://expo.dev/signup) (needed for `eas build`)
- A Google Cloud account (only if you'll be managing content via Google Sheets — see `docs/CONTENT_WORKFLOW.md`)

---

## 2. Getting the code running locally

### Mobile app

```bash
cd apps/mobile-app
npm install
npx expo start
```

This opens the Expo dev tools. From there:
- Press `w` to open in a web browser
- Press `i` for iOS simulator (Mac only, needs Xcode)
- Press `a` for Android emulator (needs Android Studio)
- Or scan the QR code with the **Expo Go** app on your phone

### Data-creator web tool

```bash
cd apps/data-creator
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) (or whatever port it reports).

---

## 3. Adding content for a new language

You don't need to write code to add a new language. Two ways to do it:

**Option A — Google Sheets (fully non-technical)**
Follow `docs/CONTENT_WORKFLOW.md` start to finish. Short version:
1. Copy the [template spreadsheet](https://docs.google.com/spreadsheets/d/1fHszqprHlFWjYB4378gJA3_CDaC_jNog51gbhicNaqA/edit?usp=sharing) (File → Make a copy) — it already has the `Decks`, `Dictionary`, `Culture` tabs set up with example rows.
2. Fill in your content.
3. Run `npm run export-content` inside `apps/mobile-app` to pull it in.
4. Run `npm run map-audio` if you added audio files.

**Option B — the data-creator web app**
Use `apps/data-creator` directly if you'd rather not touch spreadsheets at all — it writes the same content structure via the GitHub API into `apps/mobile-app`.

See also:
- `docs/AUDIO_PRONUNCIATIONS.md` — adding word/conversation audio
- `docs/CULTURE_CONTENT.md` — adding culture decks, images, quizzes
- `docs/QUIZ_IMAGES.md` — adding illustrations to quiz cards

`content-packs/dzardzongke/` is a good reference if you want to see a finished example of every content type before building your own.

---

## 4. Testing your changes

Always test locally before building a release:

```bash
cd apps/mobile-app
npm start
```

Check that:
- New cards/words appear correctly
- Images load
- Audio plays
- Text displays correctly (especially for non-Latin scripts)

---

## 5. Building an installable app

All build commands run from `apps/mobile-app`.

### Quick share build (Android APK, for testing with a small group)
```bash
eas build -p android --profile preview
```
This produces a direct-install `.apk` link — no app store needed, good for pilot testing with a community before a full release.

### Production builds (app stores)

**Android (Google Play):**
```bash
eas build -p android --profile production
eas submit -p android
```

**iOS (App Store / TestFlight):**
```bash
eas build -p ios --profile production
eas submit -p ios
```

Before building a production release, bump the version in `apps/mobile-app/app.json`:
- `expo.version` (e.g. `1.0.0` → `1.1.0`)
- `ios.buildNumber` and `android.versionCode` (increment each time you submit)

### Automated builds
Check `apps/mobile-app/.github/workflows/` — there's a CI pipeline set up to build an APK automatically on certain triggers (e.g. push to `main`). Look there before running manual builds if you just want the latest build artifact.

---

## 6. Deploying the data-creator web tool

```bash
cd apps/data-creator
npm run build
```
Deploy the `apps/data-creator` folder to Vercel (or your preferred Next.js host) — connect it to this repo with the root directory set to `apps/data-creator` if using Vercel's dashboard.

---

## 7. Contributing

- Non-technical content contributions → follow the guides in `docs/`, no code changes needed.
- Code contributions → open a PR against `apps/mobile-app` or `apps/data-creator` as appropriate. Each folder still behaves like its own project (own `package.json`, own dependencies) even though they live in one repo.
- Check `AGENTS.md` (repo root, and inside each app folder) for any project-specific conventions before making structural changes.

---

## 8. Project history

This repo was formed by merging three previously separate projects, using `git subtree` to preserve commit history:
- `apps/mobile-app` ← formerly `skeleton_forlangapp`
- `apps/data-creator` ← formerly `langdatacreator`
- `content-packs/dzardzongke` ← content/docs extracted from the original Dzardzongke prototype app

Full commit history for each piece is preserved and browsable via `git log` inside each folder.
