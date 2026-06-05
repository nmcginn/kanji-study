# Data Schema

## `data/kanji.json`

Array of kanji objects. Run `npm run ingest` to regenerate.

**Source**: [`davidluzgouveia/kanji-data`](https://github.com/davidluzgouveia/kanji-data), which is derived from:
- [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) (CC BY-SA 4.0) — stroke counts, readings, meanings
- [Jonathan Waller's JLPT Resources](http://www.tanos.co.uk/jlpt/) — updated N1–N5 JLPT levels

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

Gzipped transfer size: ~326 KB.

### RTK Frame Numbers

The `r` field is reserved for Heisig *Remembering the Kanji* 6th-edition frame numbers. It is `null` in the current ingest because the source dataset does not include Heisig data. A future PR should supplement from a Heisig dataset (KANJIDIC2's `<dic_ref dr_type="heisig6">` is one option) to enable RTK-order sorting.

When all entries have `r: null`, `sortBy(kanji, 'r')` in `src/lib/kanji.js` treats all values as `Infinity` and preserves insertion order, so the app degrades gracefully.
