# Data Schema

## `public/data/kanji.json`

Array of kanji objects. Run `npm run ingest` to regenerate.

**Sources**:
- [`davidluzgouveia/kanji-data`](https://github.com/davidluzgouveia/kanji-data) (CC BY-SA 4.0), derived from:
  - [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) (CC BY-SA 4.0) — stroke counts, readings, meanings
  - [Jonathan Waller's JLPT Resources](http://www.tanos.co.uk/jlpt/) — updated N1–N5 JLPT levels
- [`sdcr/heisig-kanjis`](https://github.com/sdcr/heisig-kanjis) (CC0) — RTK 6th-edition frame numbers

### Shape

```ts
type KanjiEntry = {
  c: string;             // kanji character
  s: number | null;      // stroke count
  j: 1|2|3|4|5|null;    // JLPT level (5=N5 easiest, 1=N1 hardest), null if not in JLPT
  r: number | null;      // RTK frame number (Heisig 6th ed) — null in current ingest, see below
  m: string[];           // English meanings
  on: string[];          // on'yomi readings
  kun: string[];         // kun'yomi readings
};
```

### Stats (current ingest)

| Field | Count |
|-------|-------|
| Total entries | 13,108 |
| With JLPT level | 2,211 |
| N5 | 79 |
| N4 | 166 |
| N3 | 367 |
| N2 | 367 |
| N1 | 1,232 |
| With RTK frame number | 3,000 |

Gzipped transfer size: ~326 KB.

### RTK Frame Numbers

The `r` field contains *Remembering the Kanji* 6th-edition frame numbers from [`sdcr/heisig-kanjis`](https://github.com/sdcr/heisig-kanjis) (CC0). RTK covers 3,001 kanji; the remaining ~10,000 entries in the dataset have `r: null`.

`sortBy(kanji, 'r')` in `src/lib/kanji.js` treats `null` values as `Infinity`, so non-RTK kanji sort to the end.
