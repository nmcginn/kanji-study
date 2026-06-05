# kanji-study

A personal kanji learning app, live at **https://nmcginn.github.io/kanji-study/**

## What it is

A browser-based flashcard tool for studying kanji using the [Heisig RTK](https://www.amazon.com/Remembering-Kanji-Complete-Japanese-Characters/dp/0824835921) keyword method. Browse and filter kanji by JLPT level, stroke count, or RTK frame order, then drill them as flashcards. Progress is stored locally in your browser — no accounts, no sync, no server.

## Who it's for

An audience of one. Built for personal use; no warranty, no support, no guarantees. If it works for you too, great.

## Who built it

Designed and coded by [Claude](https://claude.ai) (Anthropic), directed by [@nmcginn](https://github.com/nmcginn).

## Data

Kanji data is derived from [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) (CC BY-SA 4.0), with JLPT level assignments from [Jonathan Waller's JLPT Resources](http://www.tanos.co.uk/jlpt/) and RTK frame numbers from [heisig-kanjis](https://github.com/sdcr/heisig-kanjis).

## Dev

```
npm install
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → dist/
```

Deploys automatically to GitHub Pages on push to `main`.
