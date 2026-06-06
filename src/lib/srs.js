import { get, set } from './storage.js';

const KEY = 'srs';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function loadProgress() {
  return get(KEY, {});
}

export function saveProgress(p) {
  set(KEY, p);
}

export function isDue(state) {
  return !!state && state.due <= today();
}

export const RATINGS = [
  { label: 'Again', v: 0 },
  { label: 'Hard',  v: 1 },
  { label: 'Good',  v: 2 },
  { label: 'Easy',  v: 3 },
];

// rating: 0=Again, 1=Hard, 2=Good, 3=Easy
// isNew: card has no saved state (never graduated from a session)
// Returns new CardState, or null when a new card gets "Again" (don't save yet)
export function applyRating(state, rating, isNew) {
  if (isNew) {
    if (rating === 0) return null;
    if (rating === 3) return { interval: 4, ease: 2.7, due: addDays(4), reps: 1 };
    return { interval: 1, ease: 2.5, due: addDays(1), reps: 1 };
  }

  const ease = state.ease ?? 2.5;
  const interval = state.interval ?? 1;
  const reps = (state.reps ?? 0) + 1;

  if (rating === 0) {
    return { interval: 1, ease: Math.max(1.3, ease - 0.20), due: today(), reps };
  }
  if (rating === 1) {
    const i = Math.max(1, Math.round(interval * 1.2));
    return { interval: i, ease: Math.max(1.3, ease - 0.15), due: addDays(i), reps };
  }
  if (rating === 2) {
    const i = Math.max(1, Math.round(interval * ease));
    return { interval: i, ease, due: addDays(i), reps };
  }
  // rating === 3: Easy
  const newEase = Math.min(4.0, ease + 0.15);
  const i = Math.max(1, Math.round(interval * newEase * 1.3));
  return { interval: i, ease: newEase, due: addDays(i), reps };
}

// Returns 'new' | 'due' | 'known' for a single character.
export function getCardStatus(progress, char) {
  const state = progress[char];
  if (!state) return 'new';
  return isDue(state) ? 'due' : 'known';
}

// Returns an ordered array of kanji objects for a session.
// Due reviews come first, then fresh new cards up to newLimit.
export function buildQueue(allKanji, progress, { deck, newLimit }) {
  let pool;
  if (deck === 'n5')      pool = allKanji.filter(k => k.j === 5);
  else if (deck === 'n4') pool = allKanji.filter(k => k.j >= 4);
  else if (deck === 'n3') pool = allKanji.filter(k => k.j >= 3);
  else                    pool = allKanji.filter(k => k.r != null); // RTK order

  // Stable ordering: RTK frame → stroke count → codepoint
  pool = [...pool].sort((a, b) =>
    (a.r ?? 99999) - (b.r ?? 99999) ||
    (a.s ?? 99)    - (b.s ?? 99)    ||
    a.c.codePointAt(0) - b.c.codePointAt(0)
  );

  const due   = pool.filter(k =>  progress[k.c] && isDue(progress[k.c]));
  const fresh = pool.filter(k => !progress[k.c]).slice(0, newLimit);

  return [...due, ...fresh];
}
