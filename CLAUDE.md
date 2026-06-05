# kanji-study

A kanji learning app combining the Heisig RTK keyword method with flexible ordering and filtering by JLPT level, stroke count, and other criteria. Unlike WaniKani or Anki, the user chooses their ordering strategy. Runs entirely in the browser — no backend, no accounts.

## Architecture

- **Hosting**: GitHub Pages (static only — no server-side logic, ever)
- **Data**: KANJIDIC2-derived JSON bundled in `data/` — no runtime database, no external API calls for kanji data
- **Progress**: `localStorage` only — no accounts, no sync
- **Automations**: GitHub Actions for data processing and deployment

### Explicitly forbidden
- Backend services, API endpoints, server-side rendering
- Database dependencies (SQL, IndexedDB — localStorage is sufficient for v1)
- Heavy frameworks (React, Vue, Angular)

## Tech Stack

- **JS**: Vanilla ES modules — no framework
- **Build**: Vite
- **CSS**: Plain CSS with custom properties for all theming
- **Data**: `data/kanji.json` (processed from KANJIDIC2, CC BY-SA licensed)

## Dev Commands

```
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Serve dist/ locally
```

## File Structure

```
data/               # Static JSON data (kanji.json, etc.)
src/
  components/       # Reusable UI modules (vanilla JS)
  views/            # Page-level views: browse, drill, settings
  lib/              # Pure functions: filtering, sorting, storage
  main.js           # Entry point and client-side routing
index.html
vite.config.js
```

## Domain Concepts

- **RTK (Remembering the Kanji)**: Heisig method — each kanji has an English keyword and a memorable story built from primitives. Traditionally ordered by component complexity.
- **Primitives / radicals**: Sub-components of kanji used as story building blocks (e.g., 口 "mouth", 日 "sun").
- **JLPT N5–N1**: Japanese Language Proficiency Test tiers. N5 = most common/beginner (~100 kanji), N1 = advanced (~2000+ kanji).
- **KANJIDIC2**: Comprehensive kanji dictionary (CC BY-SA) with readings, meanings, JLPT level, stroke count, and radical info.
- **SRS (Spaced Repetition)**: Algorithm to schedule reviews at optimal intervals. Not in v1 — v1 tracks only seen/unseen per kanji in localStorage.

## V1 Features

1. Browse and filter kanji (by JLPT level, RTK order, stroke count, etc.)
2. Flashcard drill mode (kanji → keyword, or keyword → kanji)
3. Custom deck ordering (mix and reorder criteria, e.g. "JLPT N5 in RTK order")
4. Progress tracking via localStorage (seen/unseen, correct/incorrect counts)

## Code Style

- Prefer browser-native APIs (fetch, CSS Grid, Web Components) over libraries
- ES modules throughout — no CommonJS
- Mobile-first responsive layout
- Plain functions and data objects — no class hierarchies
- No comments unless the *why* is non-obvious
- Don't abstract until you have three concrete repetitions

## Development Workflow

- **Small PRs**: Each PR should do one coherent thing. Prefer multiple focused PRs over a single large one so changes are easy to review and understand.
- **Branch from main**: Feature branches off `main`; merge via PR, not direct push.
- **Docs as memory**: Design decisions, data schemas, and feature specs live in `docs/` as Markdown. Keep these separate from source code. Update them when decisions change — they are the source of truth for *why*, not just *what*.

### `docs/` structure

```
docs/
  data-schema.md      # Shape of kanji.json and related data structures
  features/           # One file per feature: scope, design decisions, open questions
  adr/                # Architecture Decision Records for significant choices
```

## Constraints

- Keep the JS bundle small. Establish and document a size budget once the initial build is working.
- No auto-generated scaffolding beyond what Vite provides out of the box.
