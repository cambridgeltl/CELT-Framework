# CELT-Framework — notes for contributors and coding agents

## Layout
- `apps/mobile-app` — Expo / React Native learner app (own package.json). See its AGENTS.md.
- `apps/data-creator` — Next.js content-authoring tool (own package.json).
- `content-packs/<language>` — reference content; `docs/` — non-technical content guides.
- `archive/` — retired prototype, read-only.

## Before committing
- Mobile app: `cd apps/mobile-app && npm run typecheck && npm test`
- Data creator: `cd apps/data-creator && npx tsc --noEmit && npm run lint`
- CI (`.github/workflows/ci.yml`) runs the same checks on pushes to `main` and on pull requests.

## Conventions
- Never hardcode a language. Content is discovered by language code (`lang` field or folder name).
- Per-language settings (e.g. the culture map in `assets/culture/maps.json`) live in content files, not code.
- Content JSON keeps the legacy field names `dz` (dictionary word) and `dzardzongke` (conversation line);
  loaders also accept the neutral `word` / `target`.
