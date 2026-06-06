# Drill Mode

## Status: In Progress

## Scope

Two practice modes sharing a single flashcard + self-rating engine:

| Mode | Front | Back | Ratings |
|------|-------|------|---------|
| Recognition | Kanji character | Meaning + readings | Again / Hard / Good / Easy |
| RTK Style | English keyword | Kanji + readings | Again / Good / Easy |

Recognition tests passive recall (the reading-focused path). RTK Style tests active production — the user draws the kanji before flipping, then self-rates honestly.

## User flow

```
#/drill
  └─ Setup screen
       ├─ Pick mode (Recognition / RTK Style)
       ├─ Pick deck (JLPT N5 · N4+ · N3+ · RTK Order)
       ├─ Pick new cards per session (5 / 10 / 20)
       └─ Start Session
            └─ Session screen (loop)
                 ├─ Show card front
                 ├─ Tap card or "Show Answer" → flip
                 ├─ Rate: Again | [Hard] | Good | Easy
                 │    Again  → card re-queued at end of session
                 │    other  → card scheduled, move to next
                 └─ Queue empty → Summary screen
                      ├─ Highlights: new learned / cards done / correct %
                      ├─ Breakdown bar chart per rating
                      └─ [Drill Again] [Home]
```

## SRS algorithm (simplified SM2)

Cards are stored in `localStorage` under key `ks:srs` as `{ [char]: CardState }`.

```ts
type CardState = {
  interval: number   // days until next review
  ease:     number   // multiplier, starts at 2.5, min 1.3
  due:      string   // ISO date "YYYY-MM-DD"
  reps:     number   // total reviews
}
```

Rating effects (new cards graduating in their first session):

| Rating | New card | Review card |
|--------|----------|-------------|
| Again (0) | Retry now; no state saved | interval=1, ease−0.20, retry now |
| Hard  (1) | Graduate; interval=1, ease=2.5 | interval×1.2, ease−0.15 |
| Good  (2) | Graduate; interval=1, ease=2.5 | interval×ease |
| Easy  (3) | Graduate; interval=4, ease=2.7 | interval×ease×1.3, ease+0.15 |

Session queue: due reviews first, then new cards up to `newLimit`. "Again" cards are appended to the current session queue so they are retried before the session ends.

## Deck ordering

Cards within a deck are sorted: RTK frame number ascending (nulls last), then stroke count, then character codepoint. This naturally puts the most fundamental kanji first regardless of which deck is active.

Deck filters:

| Deck | Filter |
|------|--------|
| JLPT N5 | `j === 5` (~101 kanji) |
| JLPT N4+ | `j >= 4` (~282 kanji) |
| JLPT N3+ | `j >= 3` (~643 kanji) |
| RTK Order | `r != null` (~3000 kanji sorted by frame) |

## Implementation checklist

- [x] `src/lib/srs.js` — SRS engine: load/save progress, `applyRating`, `buildQueue`
- [x] `src/views/drill.js` — full view state machine (setup → session → summary)
  - [x] Setup phase: mode / deck / new-card-count pickers
  - [x] Session phase: card flip animation, show-answer / rating controls
  - [x] Summary phase: highlights, per-rating breakdown bar chart
- [x] `src/style.css` — drill mode styles appended

## Open questions / future work

- [ ] "Leech" detection: flag cards answered Again ≥ 8 times
- [ ] Progress indicators in Browse view (seen/unseen overlay on cards)
- [ ] Settings page: reset progress, change daily new-card limit globally
- [ ] Undo last rating (one step back)
- [ ] Audio readings (if a royalty-free source is found)
