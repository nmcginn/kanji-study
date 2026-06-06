import { loadKanji } from '../lib/kanji.js';
import { loadProgress, saveProgress, applyRating, buildQueue } from '../lib/srs.js';

// Session state — module-level so it persists across re-renders within a session
let phase = 'setup'; // 'setup' | 'session' | 'summary'
let sessionMode = 'recognition'; // 'recognition' | 'rtk'
let deckChoice = 'n5';
let newLimit = 10;
let queue = [];
let isNewArr = []; // parallel to queue: true if card had no SRS state at session start
let idx = 0;
let flipped = false;
let progress = {};
let stats = { again: 0, hard: 0, good: 0, easy: 0, learned: 0 };
let completed = 0;

export function drillView() {
  phase = 'setup';
  return { html: renderSetup(), init: initSetup };
}

// Direct DOM update — avoids the main router and lets us animate card flips
// without tearing down the whole view.
function rerender() {
  const app = document.getElementById('app');
  if (!app) return;
  if (phase === 'setup') {
    app.innerHTML = renderSetup();
    initSetup();
  } else if (phase === 'session') {
    app.innerHTML = renderSession();
    initSession();
  } else {
    app.innerHTML = renderSummary();
    initSummary();
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function renderSetup() {
  const decks = [['n5', 'JLPT N5'], ['n4', 'JLPT N4+'], ['n3', 'JLPT N3+'], ['rtk', 'RTK Order']];
  return `
    <section class="drill-setup">
      <h2>Drill Session</h2>

      <div class="setup-group">
        <p class="setup-label">Practice mode</p>
        <div class="setup-mode-cards">
          <button class="setup-mode-card${sessionMode === 'recognition' ? ' selected' : ''}" data-mode="recognition">
            <span class="setup-mode-icon kanji">漢</span>
            <strong>Recognition</strong>
            <span>See kanji → recall meaning</span>
          </button>
          <button class="setup-mode-card${sessionMode === 'rtk' ? ' selected' : ''}" data-mode="rtk">
            <span class="setup-mode-icon">✏</span>
            <strong>RTK Style</strong>
            <span>See keyword → draw kanji</span>
          </button>
        </div>
      </div>

      <div class="setup-group">
        <p class="setup-label">Deck</p>
        <div class="filter-bar">
          ${decks.map(([k, v]) =>
            `<button class="chip${deckChoice === k ? ' chip-active' : ''}" data-deck="${k}">${v}</button>`
          ).join('')}
        </div>
      </div>

      <div class="setup-group">
        <p class="setup-label">New cards per session</p>
        <div class="filter-bar">
          ${[5, 10, 20].map(n =>
            `<button class="chip${newLimit === n ? ' chip-active' : ''}" data-new="${n}">${n}</button>`
          ).join('')}
        </div>
      </div>

      <button class="btn btn-accent setup-start" id="start-session">Start Session</button>
      <p class="setup-msg" id="setup-msg"></p>
    </section>
  `;
}

function initSetup() {
  document.querySelectorAll('[data-mode]').forEach(el =>
    el.addEventListener('click', () => { sessionMode = el.dataset.mode; rerender(); })
  );
  document.querySelectorAll('[data-deck]').forEach(el =>
    el.addEventListener('click', () => { deckChoice = el.dataset.deck; rerender(); })
  );
  document.querySelectorAll('[data-new]').forEach(el =>
    el.addEventListener('click', () => { newLimit = +el.dataset.new; rerender(); })
  );
  document.getElementById('start-session')?.addEventListener('click', startSession);
}

async function startSession() {
  const btn = document.getElementById('start-session');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }

  const allKanji = await loadKanji();
  progress = loadProgress();
  const q = buildQueue(allKanji, progress, { deck: deckChoice, newLimit });

  if (q.length === 0) {
    const msg = document.getElementById('setup-msg');
    if (msg) msg.textContent = 'No cards available for this deck — try a different deck or come back later for reviews.';
    if (btn) { btn.disabled = false; btn.textContent = 'Start Session'; }
    return;
  }

  queue    = q;
  isNewArr = q.map(k => !progress[k.c]);
  idx      = 0;
  flipped  = false;
  completed = 0;
  stats    = { again: 0, hard: 0, good: 0, easy: 0, learned: 0 };
  phase    = 'session';
  rerender();
}

// ─── Session ─────────────────────────────────────────────────────────────────

function getRatingOptions() {
  // RTK mode omits "Hard" — the user either drew it or didn't.
  return sessionMode === 'rtk'
    ? [{ label: 'Again', v: 0 }, { label: 'Good', v: 2 }, { label: 'Easy', v: 3 }]
    : [{ label: 'Again', v: 0 }, { label: 'Hard', v: 1 }, { label: 'Good', v: 2 }, { label: 'Easy', v: 3 }];
}

function renderSession() {
  const card      = queue[idx];
  const remaining = queue.length - idx;
  const total     = completed + remaining;
  const pct       = total > 0 ? (completed / total) * 100 : 0;
  const isNew     = isNewArr[idx];
  const isRtk     = sessionMode === 'rtk';

  const readings = `
    <div class="drill-readings">
      ${card.on.length  ? `<span class="drill-reading-group"><span class="drill-reading-label">On</span>${card.on.slice(0, 3).join('、')}</span>`  : ''}
      ${card.kun.length ? `<span class="drill-reading-group"><span class="drill-reading-label">Kun</span>${card.kun.slice(0, 3).join('、')}</span>` : ''}
    </div>
  `;

  const frontContent = isRtk ? `
    <p class="drill-prompt">Draw this kanji:</p>
    <p class="drill-keyword">${card.m[0] ?? '(no keyword)'}</p>
  ` : `
    <div class="drill-kanji kanji">${card.c}</div>
  `;

  const backContent = isRtk ? `
    <div class="drill-kanji kanji">${card.c}</div>
    ${readings}
    <div class="drill-meanings">${card.m.slice(0, 4).join(' · ')}</div>
  ` : `
    <div class="drill-meaning-primary">${card.m[0] ?? ''}</div>
    ${card.m.length > 1 ? `<div class="drill-meaning-alt">${card.m.slice(1, 4).join(' · ')}</div>` : ''}
    ${readings}
  `;

  return `
    <section class="drill-session">
      <div class="drill-progress">
        <div class="drill-progress-bar">
          <div class="drill-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="drill-progress-meta">
          <span>${remaining} remaining</span>
          <span class="drill-badge ${isNew ? 'badge-new' : 'badge-review'}">${isNew ? 'NEW' : 'REVIEW'}</span>
        </div>
      </div>

      <div class="drill-card-wrapper">
        <div class="drill-card" id="drill-card">
          <div class="drill-card-inner">
            <div class="drill-card-front">${frontContent}</div>
            <div class="drill-card-back">${backContent}</div>
          </div>
        </div>
        <p class="drill-card-hint">tap card or press Show Answer</p>
      </div>

      <div id="drill-controls" class="drill-controls">
        <button class="btn btn-accent drill-show-btn" id="show-answer">Show Answer</button>
      </div>
    </section>
  `;
}

function initSession() {
  document.getElementById('show-answer')?.addEventListener('click', showAnswer);
  document.getElementById('drill-card')?.addEventListener('click', () => {
    if (!flipped) showAnswer();
  });
}

// Flip the card in place (CSS transition) and swap controls to rating buttons.
// Avoids a full re-render so the flip animation plays smoothly.
function showAnswer() {
  if (flipped) return;
  flipped = true;
  document.getElementById('drill-card')?.classList.add('flipped');

  const controls = document.getElementById('drill-controls');
  if (!controls) return;

  const opts = getRatingOptions();
  controls.className = 'drill-ratings';
  controls.innerHTML = opts.map(r =>
    `<button class="btn rating-btn rating-${r.label.toLowerCase()}" data-rating="${r.v}">${r.label}</button>`
  ).join('');
  controls.querySelectorAll('[data-rating]').forEach(btn =>
    btn.addEventListener('click', () => handleRating(+btn.dataset.rating))
  );
}

function handleRating(rating) {
  const card   = queue[idx];
  const wasNew = isNewArr[idx];

  if      (rating === 0) stats.again++;
  else if (rating === 1) stats.hard++;
  else if (rating === 2) stats.good++;
  else                   stats.easy++;

  if (rating === 0) {
    // "Again": re-queue for retry. Review cards still get their SRS state updated
    // (interval reset to 1, due tomorrow) so progress is saved even if we retry now.
    queue.push(card);
    isNewArr.push(wasNew);
    if (!wasNew) {
      const next = applyRating(progress[card.c], 0, false);
      if (next) { progress[card.c] = next; saveProgress(progress); }
    }
  } else {
    const next = applyRating(progress[card.c] ?? null, rating, wasNew);
    if (next) { progress[card.c] = next; saveProgress(progress); }
    if (wasNew && next) stats.learned++;
    completed++;
  }

  idx++;
  flipped = false;
  phase   = idx >= queue.length ? 'summary' : 'session';
  rerender();
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function barPct(n, total) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function renderSummary() {
  const total   = stats.again + stats.hard + stats.good + stats.easy;
  const correct = stats.hard + stats.good + stats.easy;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isRtk   = sessionMode === 'rtk';

  const breakdownRow = (key, label) => `
    <div class="breakdown-row">
      <span class="breakdown-dot dot-${key}"></span>
      <span class="breakdown-label">${label}</span>
      <span class="breakdown-bar-wrap">
        <span class="breakdown-bar bar-${key}" style="width:${barPct(stats[key], total)}%"></span>
      </span>
      <span class="breakdown-count">${stats[key]}</span>
    </div>
  `;

  return `
    <section class="drill-summary">
      <h2>Session Complete!</h2>

      <div class="summary-highlights">
        <div class="summary-highlight">
          <span class="highlight-value">${stats.learned}</span>
          <span class="highlight-label">New learned</span>
        </div>
        <div class="summary-highlight">
          <span class="highlight-value">${completed}</span>
          <span class="highlight-label">Cards done</span>
        </div>
        <div class="summary-highlight">
          <span class="highlight-value">${pct}%</span>
          <span class="highlight-label">Correct</span>
        </div>
      </div>

      <div class="summary-breakdown">
        ${breakdownRow('again', 'Again')}
        ${!isRtk ? breakdownRow('hard', 'Hard') : ''}
        ${breakdownRow('good', 'Good')}
        ${breakdownRow('easy', 'Easy')}
      </div>

      <div class="summary-actions">
        <button class="btn btn-accent" id="drill-again">Drill Again</button>
        <a href="#/" class="btn">Home</a>
      </div>
    </section>
  `;
}

function initSummary() {
  document.getElementById('drill-again')?.addEventListener('click', () => {
    phase = 'setup';
    rerender();
  });
}
