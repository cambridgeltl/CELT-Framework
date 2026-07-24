<div align="center">

<br />

# 🌐 Language Data Creator

**Create structured content for language learning apps — visually.**

Flashcard decks · Dictionaries · Conversations · Culture lessons · GitHub sync

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br />

</div>

> **Language Data Creator** is a web-based tool that lets teachers, developers, and community contributors build learning materials through a visual interface — no manual JSON editing. Author content, record audio in-browser, then push everything to GitHub where your learning app can consume it.

<br />

## ⚡ Quick Start

```bash
git clone https://github.com/<your-username>/langdatacreator.git
cd langdatacreator
pnpm install        # or npm install
pnpm dev            # → http://localhost:3000
```

> **Prerequisites:** [Node.js](https://nodejs.org/) 18+ &nbsp;·&nbsp; [pnpm](https://pnpm.io/) (recommended) &nbsp;·&nbsp; [GitHub PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for syncing

<br />

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📇 Flashcard Decks
Create decks with front/back text, notes, and images. Responsive card grid with flip animation preview. Export each deck as `[id].json`.

</td>
<td width="50%" valign="top">

### 📖 Dictionary
Target-language word, English translation, bilingual examples, and audio. Search, filter, sort instantly. Record pronunciation in-browser.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 💬 Conversations
Three-level dialogue authoring: **Categories → Conversations → Exchanges**. Speaker A/B with bilingual text + optional audio. Chat-bubble preview.

</td>
<td width="50%" valign="top">

### 🌍 Culture Lessons
Multi-step lessons with **Text**, **Image**, **Quiz Single**, and **Quiz Multi** step types. Drag-to-reorder. Export per lesson.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎤 Audio & Image Staging
Media files are staged locally first. Preview, rename, or remove before committing. No accidental uploads.

</td>
<td width="50%" valign="top">

### 🐙 GitHub Sync
One-click push with smart merge. Dictionary entries merged by word key, conversations by category ID. Binary asset upload included.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📦 Bulk Upload & Import
Drop entire folders of JSON and media files — the system auto-detects types, matches audio/images to content, and uploads everything with smart merge and duplicate detection.

</td>
<td width="50%" valign="top">

### 🌓 Dark Mode
System-aware dark/light toggle. All theming via CSS custom properties for instant, flicker-free transitions.

</td>
</tr>
</table>

<br />

## 📁 Repository Structure on GitHub

All synced content lives under `assets/`:

```
assets/
├── 📂 audio/
│   ├── 📂 dictionary_words/                  ← word pronunciations
│   │   ├── hello.wav
│   │   └── thank-you.wav
│   └── 📂 conversations/                     ← dialogue audio
│       └── {category-id}/
│           └── {conversation-id}/
│               ├── 1_A.wav
│               ├── 1_B.wav
│               ├── 2_A.wav
│               └── 2_B.wav
│
├── 📂 images/
│   ├── 📂 decks/                             ← flashcard images
│   │   └── {deck-id}/
│   │       ├── white-dog.png
│   │       └── orange-cat.png
│   └── 📂 culture/                           ← lesson images
│       ├── monastery-photo.png
│       └── festival-image.jpg
│
├── 📂 dictionary/
│   └── dictionary.dict.json                  ← all vocabulary entries
│
├── 📂 decks/
│   └── {deck-id}.json                        ← one JSON per deck
│
├── 📂 conversations/
│   └── conversations.json                    ← all dialogues
│
└── 📂 culture/
    └── dz/
        └── {deck-id}.json                    ← one JSON per lesson
```

<br />

## 🏷️ File Naming Conventions

<table>
<tr>
<th>Content</th>
<th>Pattern</th>
<th>Example Path</th>
</tr>
<tr>
<td><strong>Dictionary audio</strong></td>
<td><code>{sanitized-word}.wav</code></td>
<td><code>assets/audio/dictionary_words/thank-you.wav</code></td>
</tr>
<tr>
<td><strong>Conversation audio</strong></td>
<td><code>{textNo}_{A|B}.wav</code></td>
<td><code>assets/audio/conversations/greetings/greeting1/1_A.wav</code></td>
</tr>
<tr>
<td><strong>Deck images</strong></td>
<td><code>{deck-id}/{filename}.png</code></td>
<td><code>assets/images/decks/animals/white-dog.png</code></td>
</tr>
<tr>
<td><strong>Culture images</strong></td>
<td><code>{filename}.{ext}</code></td>
<td><code>assets/images/culture/monastery-photo.jpg</code></td>
</tr>
</table>

> **Conversation audio** uses 1-based exchange numbers and speaker `A` or `B` — e.g., the 3rd exchange, Speaker B → `3_B.wav`

<br />

## 🎙️ Audio Specs

| | |
| :--- | :--- |
| **Default format** | WAV — 16-bit PCM, 44.1 kHz, mono |
| **Also supported** | MP3, OGG, M4A, WEBM |

<br />

## 🔤 Filename Sanitization

All filenames are cleaned before upload:

| Rule | Example |
| :--- | :--- |
| Lowercase + hyphens | `Hello World` → `hello-world` |
| Strip special chars | `word@2024!` → `word2024` |
| Collapse hyphens | `café__latte` → `caf-latte` |
| Preserve non-Latin scripts | `ཅེ་མོ་ཇ` → `ཅེ-མོ-ཇ` |

<br />

## 📐 Project Structure

```
app/
├── layout.tsx                  # Root layout (fonts, header, nav, footer)
├── page.tsx                    # Landing redirect → /decks
├── globals.css                 # Theme + CSS variables
│
├── decks/page.tsx              # Flashcard deck editor
├── dictionary/page.tsx         # Dictionary with search & audio
├── conversations/page.tsx      # Three-level dialogue authoring
├── culture/page.tsx            # Culture lesson builder
│
├── components/
│   ├── ui/                     # Button, Card, Modal, Tabs, Input,
│   │                             Select, Badge, Toast, Progress, Skeleton
│   ├── github-popup/           # Sync tabs per content type
│   ├── DecksDashboard.tsx      # Deck grid with CRUD
│   ├── DeckView.tsx            # Card editor + flip animation
│   ├── AudioRecorder.tsx       # In-browser mic recorder
│   ├── AudioReviewDashboard.tsx# Staged audio review
│   ├── Navigation.tsx          # Tab bar + dark mode
│   ├── GitHubPopup.tsx         # GitHub sync popup
│   └── Providers.tsx           # Context provider wrapper
│
├── contexts/                   # React Context state
│   ├── DecksContext.tsx
│   ├── DictionaryContext.tsx
│   ├── ConversationsContext.tsx
│   ├── CultureContext.tsx
│   ├── AudioStagingContext.tsx
│   └── ImageStagingContext.tsx
│
├── models/                     # TypeScript data classes
│   ├── Deck.ts
│   ├── Dictionary.ts
│   ├── Conversation.ts
│   └── Culture.ts
│
├── hooks/useDarkMode.ts        # OS-aware theme hook
│
└── utils/
    ├── githubApi.ts            # GitHub REST client + smart merge
    ├── jsonGenerator.ts        # JSON export utilities
    └── folderDrop.ts           # Drag-and-drop support
```

**Architecture:** Next.js App Router · React Context + localStorage · TypeScript classes with serialization · Tailwind CSS 4 theming

<br />

---

<div align="center">

Made with [Next.js](https://nextjs.org), [React](https://react.dev), and [Tailwind CSS](https://tailwindcss.com)

</div>
