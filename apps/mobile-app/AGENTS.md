# CELT mobile app

Language-agnostic, offline-first learning app (flashcards, dictionary, conversations, quizzes, culture). All language content lives in `assets/` and is discovered by language code; Dzardzongke is the reference language.

## Project Context

- Offline-first React Native app using Expo
- Bundled JSON flashcard decks
- Local progress storage using Expo SecureStore
- TypeScript for type safety
- ESLint + Prettier for code quality
- Jest for testing

## Build Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
eas build
```

## Project Structure

```
.
├── app/
│   ├── components/    # Reusable UI components
│   ├── screens/      # Screen components
│   ├── stores/       # State management
│   └── types/        # TypeScript types
├── assets/
│   └── decks/       # JSON flashcard decks
└── test/
    ├── unit/        # Unit tests
    └── integration/ # Integration tests
```
