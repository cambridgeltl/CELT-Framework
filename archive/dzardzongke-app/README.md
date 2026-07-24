# Language Learning App for Dzardzongke

**Hannah M. Claus, Songbo Hu, Emre Isik, Anna Korhonen, Kitty Wenying Liu and Marieke Meelen**  
University of Cambridge  
`{hmc78, sh2091, sei31, alk23, wl399, mm986}@cam.ac.uk`

Link to paper: [Revitalising Endangered Languages and Cultural Heritage through Language Technology: A Pilot Study for Dzardzongke](https://aclanthology.org/2026.computel-1.8/)

This repository contains the first prototype of a mobile application designed to support the preservation and revitalisation of Dzardzongke Tibetan, an endangered language spoken by approximately 1,200 people in South Mustang, Nepal. The app supports literacy development and cultural heritage preservation through flashcards, a searchable dictionary with fuzzy search, themed conversations, multiple-choice quizzes, and a culture section with an interactive map. It is available as a web app at [dzardzongke.vercel.app](https://dzardzongke.vercel.app).

---

## Table of Contents

- [Background](#background)
- [App Features](#app-features)
- [Technical Overview](#technical-overview)
- [Getting Started](#getting-started)
- [Content Management](#content-management)
- [Adding Content](#adding-content)
  - [Flashcard Decks](#flashcard-decks)
  - [Dictionary Entries](#dictionary-entries)
  - [Audio Pronunciations](#audio-pronunciations)
  - [Culture Images](#culture-images)
- [Build and Deployment](#build-and-deployment)
- [Data and Resources](#data-and-resources)
- [Citation](#citation)
- [Acknowledgements](#acknowledgements)

---

## Background

Dzardzongke is a severely endangered Tibetan variety spoken in South Mustang, Nepal. It is primarily an oral language with no established written tradition and no digital textual resources. All native speakers are multilingual and spend their daily lives in other languages, placing the language at high risk of attrition and complete loss within the next generation. A standardised romanised orthography has recently been developed in collaboration with speakers, providing a first step towards enabling digital language use. This app builds on that orthography and on prior audio-visual documentation of the language to offer a community-driven, accessible tool for literacy development and cultural heritage preservation.

For full background, methodology, and linguistic details, see the accompanying paper:

> Hannah Claus, Songbo Hu, Emre Isik, Anna Korhonen, Kitty Liu, and Marieke Meelen. 2026. [Revitalising Endangered Languages and Cultural Heritage through Language Technology: A Pilot Study for Dzardzongke](https://aclanthology.org/2026.computel-1.8/). In Proceedings of the Ninth Workshop on the Use of Computational Methods in the Study of Endangered Languages (ComputEL-9), pages 72–79, San Diego, California, USA. Association for Computational Linguistics.

---

## App Features

- **Decks**: Vocabulary introduced through image-based flashcards, organised by theme (animals, colours, numbers, and more). Cards show an image on the front; tapping reveals the Dzardzongke spelling and an example sentence.
- **Dictionary**: A searchable, offline Dzardzongke–English dictionary with fuzzy search to accommodate spelling uncertainty in the newly standardised orthography. Each entry includes an English translation, example sentences in both languages, and an optional audio pronunciation. Users can save items to a personal word list.
- **Quizzes**: Multiple-choice quizzes for self-assessment. Incorrectly answered words are automatically added to the user's personal word list for follow-up review.
- **Conversations**: Themed dialogues presented as chat bubbles, each accompanied by audio. Users can switch between Dzardzongke-only and English-only display modes.
- **Culture**: A section on local traditions and festivals, presented with images, videos, audio files, and multiple-choice quizzes. Includes an interactive map guiding users through the villages of South Mustang.
- **Progress tracking**: Users can track completed decks and review saved vocabulary via their profile.

---

## Technical Overview

The app is implemented in TypeScript (96.2%) and JavaScript (3.8%) using [React Native](https://reactnative.dev/) with the [Expo](https://expo.dev) framework, supporting cross-platform deployment on Android, iOS, and web. The web version is deployed at [dzardzongke.vercel.app](https://dzardzongke.vercel.app). Android APK builds are handled via EAS (Expo Application Services).

All linguistic content is separated from the core application framework and stored as structured static JSON files with associated multimedia assets. This content–framework decoupling means that new Dzardzongke materials can be added at any time without modifying the underlying system architecture, and the framework can be adapted for other endangered or underserved languages without requiring app development expertise.

All content and user data are stored locally on the device. Only the interactive map feature requires an internet connection. This offline-first design is particularly important for users in rural and remote regions with limited connectivity.

---

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npx expo start
```

From there you can open the app in a:
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

---

## Content Management

### For Non-Technical Users (Recommended)

The app supports **Google Sheets-based content management** — no coding required. Community members and researchers can add and edit dictionary entries, flashcard decks, culture content, quiz material, and audio links directly in a spreadsheet, then sync changes to the app with a single command:

```bash
npm run export-content
```

See the following guides for full instructions:
- [Content Workflow Guide](docs/CONTENT_WORKFLOW.md) — complete setup and usage
- [Google Sheets Template](docs/GOOGLE_SHEETS_TEMPLATE.md) — spreadsheet structure and examples
- [Audio Guide](docs/AUDIO_PRONUNCIATIONS.md) — how to add audio pronunciations
- [Image Guide](docs/QUIZ_IMAGES.md) — how to add images to quizzes

### For Developers

All original JSON-based workflows are also supported for direct file editing. See the sections below.

---

## Adding Content

### Flashcard Decks

Decks are stored in `/assets/decks/` as JSON files with the following structure:

```json
{
  "id": "unique-deck-id",
  "title": "Deck Title",
  "description": "Description of what this deck teaches",
  "cards": [
    {
      "id": "card-unique-id",
      "front": "Content for front of card (text or image filename)",
      "back": "Content for back of card",
      "notes": "Additional explanations or context",
      "image": "optional-image-filename.png",
      "hasAudio": false
    }
  ]
}
```

To add image-based cards, place image files in `/assets/images/animals/` or another appropriate subdirectory. The build script will automatically register any images placed there. Reference the image filename in the card's `front` field.

For language learning cards, the `notes` field supports `\n` for formatting. We recommend including word-by-word translations and grammatical patterns, for example:

```
"notes": "White dog\n\nkyi = dog\nkaru = white\ncik = a/an\n\nWord order in Dzardzongke: noun + adjective + article"
```

### Dictionary Entries

The Dzardzongke dictionary is stored in `/assets/dictionary/dzardzongke.dict.json`. Each entry follows this structure:

```json
{
  "dz": "Dzardzongke word",
  "en": "English translation",
  "example": "Example sentence in Dzardzongke",
  "exampleEn": "Example sentence in English",
  "audio": "optional-audio-file.mp3"
}
```

Entries should be alphabetically sorted by the `dz` field. To add a new entry, open the file and insert a new object following the structure above.

### Audio Pronunciations

1. Record or obtain an MP3 file of the pronunciation (recommended: 128kbps, under 100KB).
2. Name the file after the Dzardzongke word (e.g., `go.mp3`); for words with spaces, use underscores (e.g., `go_tsukken.mp3`).
3. Place the file in `/assets/audio/`.
4. Add the `audio` field to the relevant dictionary entry in `dzardzongke.dict.json`.
5. Register the file in `/app/services/AudioService.ts`:

```typescript
const audioMap: Record<string, any> = {
  'go.mp3': require('../../assets/audio/go.mp3'),
  'your_new_file.mp3': require('../../assets/audio/your_new_file.mp3'),
};
```

For batch processing, place all MP3 files in `/assets/audio/`, update all corresponding dictionary entries, and register all files in `AudioService.ts`.

### Culture Images

Place culture images in `assets/images/culture/`. Recommended format: landscape, at least 1600px wide, `.jpg` or `.png`. If you change a filename or path, update the corresponding `require(...)` call in `app/screens/Culture.tsx`.

---

## Build and Deployment

### Web

The app is deployed as a web version at [dzardzongke.vercel.app](https://dzardzongke.vercel.app) via Vercel. Configuration is in `vercel.json`.

### Android APK

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Development vs Production

| Mode | Command |
|------|---------|
| Local development | `npx expo start` |
| APK preview build | `eas build --profile preview` |
| Production build | `eas build --profile production` |

### Common Build Issues

**Lockfile sync errors**: Run `rm -rf node_modules && npm install`, then commit the updated `package-lock.json`.

**Image path case sensitivity**: EAS builds on Linux (case-sensitive). Ensure import paths match exact folder and file names, e.g. `assets/images/culture/` not `assets/images/Culture/`.

**Missing peer dependencies**: Run `npx expo install react-native-svg` and `npx expo install --check`.

**Metro bundler errors**: Run `npx expo start --clear` to clear the cache.

---

## Data and Resources

- **Audio-visual archive**: All recordings are archived at ELAR: [http://hdl.handle.net/2196/aa07e8d9-de4a-4820-af20-a34054068b91](http://hdl.handle.net/2196/aa07e8d9-de4a-4820-af20-a34054068b91)
- **Dzardzongke keyboard**: A dedicated keyboard with autocorrect and predictive text based on the standardised orthography is available via the Keyman platform: [https://github.com/keymanapp/keyboards/tree/master/release/d/dzardzongke](https://github.com/keymanapp/keyboards/tree/master/release/d/dzardzongke)
- **Web app**: [dzardzongke.vercel.app](https://dzardzongke.vercel.app)

---

## Citation

If you use this app or codebase in your research, please cite (will be updated soon):

```bibtex
@inproceedings{claus-etal-2026-revitalising,
    title = "Revitalising Endangered Languages and Cultural Heritage through Language Technology: A Pilot Study for Dzardzongke",
    author = "Claus, Hannah  and
      Hu, Songbo  and
      Isik, Emre  and
      Korhonen, Anna  and
      Liu, Kitty  and
      Meelen, Marieke",
    editor = "Agyapong, Godfred  and
      Moeller, Sarah  and
      Arppe, Antti  and
      Marashian, Ali  and
      Rosenblum, Daisy",
    booktitle = "Proceedings of the Ninth Workshop on the Use of Computational Methods in the Study of Endangered Languages ({C}omput{EL}-9)",
    month = jul,
    year = "2026",
    address = "San Diego, California, USA",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2026.computel-1.8/",
    doi = "10.18653/v1/2026.computel-1.8",
    pages = "72--79",
    ISBN = "979-8-89176-422-4",
    abstract = "In this short paper, we present the first prototype of a mobile application to help preserve and revitalise the endangered language and cultural heritage of the speakers of Dzardzongke, a Tibetic language spoken in South Mustang, Nepal. With this pilot study, we provide a collaborative and highly accessible solution to revitalisation that has potential for any community interested in preserving their language and culture."
}
```

```bibtex
@misc{claus-etal-2026-dzardzongke_app,
  author = {Claus, Hannah M. and Hu, Songbo and Isik, Emre and
               Korhonen, Anna and Liu, Kitty Wenying and Meelen, Marieke},
  title  = {Language Learning App for {Dzardzongke}},
  year   = {2025},
  url    = {https://github.com/cambridgeltl/Language-Learning-App-for-Dzardzongke},
}
```

---

## Acknowledgements

We would like to thank the Dzardzongke community in Nepal and abroad for their warm welcome and enthusiastic participation in this project, including the teachers and children of the Lubrak school who shared their drawings, and the speakers who kindly helped with recordings: Kemi Tsewang, Palgen Bista, Gyaltsen Gurung, and Charles Ramble.

This research was partially supported by the European Union (ERC, PaganTibet, 101097364), the Endangered Language Documentation Programme (ELDP SG 0716), the Cambridge Humanities Research Grant (CHRG), and UK Research and Innovation (UKRI) Frontier Research Grant EP/Y031350/1 under the UK government's funding guarantee for ERC Advanced Grants for the project *Towards Globally Equitable Language Technologies (EQUATE)*. Hannah M. Claus is supported by Gates Cambridge Trust (Grant no. OPP1144 from the Bill & Melinda Gates Foundation). Views and opinions expressed are those of the authors only and do not necessarily reflect those of the European Union or the European Research Council Executive Agency.
