import { loadKanji, sortBy } from '../lib/kanji.js';

let state = {
  all: null,
  kanjiMap: null,
  jlpt: null,
  query: '',
  sortField: 'r',
  sortAsc: true,
  selected: null,
};

export function browseView() {
  return {
    html: `
      <section class="browse">
        <div class="filter-bar" role="group" aria-label="Filter by JLPT level">
          <button class="chip chip-active" data-jlpt="">All</button>
          <button class="chip" data-jlpt="5">N5</button>
          <button class="chip" data-jlpt="4">N4</button>
          <button class="chip" data-jlpt="3">N3</button>
          <button class="chip" data-jlpt="2">N2</button>
          <button class="chip" data-jlpt="1">N1</button>
        </div>
        <div class="search-bar">
          <input type="search" id="browse-search" class="search-input"
            placeholder="Search by meaning (e.g. water) or reading (e.g. みず)…"
            autocomplete="off" autocorrect="off" spellcheck="false" />
        </div>
        <div class="browse-toolbar">
          <span id="browse-count" class="browse-count">Loading…</span>
          <div class="sort-group" role="group" aria-label="Sort kanji">
            <button class="sort-btn sort-btn-active" data-sort="r">RTK ↑</button>
            <button class="sort-btn" data-sort="s">Strokes</button>
            <button class="sort-btn" data-sort="j">JLPT</button>
          </div>
        </div>
        <div id="kanji-grid" class="kanji-grid">
          <span class="browse-status">Loading…</span>
        </div>
      </section>
      <div id="detail-drawer" class="detail-drawer"></div>
    `,
    init: initBrowse,
  };
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function initBrowse() {
  state = { all: null, kanjiMap: null, jlpt: null, query: '', sortField: 'r', sortAsc: true, selected: null };

  try {
    state.all = await loadKanji();
    state.kanjiMap = new Map(state.all.map(k => [k.c, k]));
  } catch {
    const grid = document.getElementById('kanji-grid');
    if (grid) grid.innerHTML = '<span class="browse-status">Failed to load kanji data.</span>';
    return;
  }

  if (!document.getElementById('kanji-grid')) return;

  document.querySelector('.filter-bar').addEventListener('click', e => {
    const chip = e.target.closest('[data-jlpt]');
    if (!chip) return;
    state.jlpt = chip.dataset.jlpt === '' ? null : Number(chip.dataset.jlpt);
    state.selected = null;
    document.querySelectorAll('.chip').forEach(c =>
      c.classList.toggle('chip-active', c === chip)
    );
    render();
  });

  document.getElementById('browse-search').addEventListener('input', e => {
    state.query = e.target.value.trim();
    render();
  });

  document.querySelector('.sort-group').addEventListener('click', e => {
    const btn = e.target.closest('[data-sort]');
    if (!btn) return;
    if (state.sortField === btn.dataset.sort) {
      state.sortAsc = !state.sortAsc;
    } else {
      state.sortField = btn.dataset.sort;
      state.sortAsc = true;
    }
    updateSortButtons();
    render();
  });

  document.getElementById('kanji-grid').addEventListener('click', e => {
    const card = e.target.closest('.kanji-card');
    if (!card) return;
    const k = state.kanjiMap.get(card.dataset.char);
    if (!k) return;
    const wasSelected = state.selected?.c === k.c;
    state.selected = wasSelected ? null : k;
    document.querySelectorAll('.kanji-card').forEach(c =>
      c.classList.toggle('kanji-card-active', c === card && !wasSelected)
    );
    renderDetail();
  });

  document.getElementById('detail-drawer').addEventListener('click', e => {
    if (!e.target.closest('.detail-close')) return;
    state.selected = null;
    document.querySelectorAll('.kanji-card').forEach(c =>
      c.classList.remove('kanji-card-active')
    );
    renderDetail();
  });

  render();
}

function getFiltered() {
  let base = state.jlpt ? state.all.filter(k => k.j === state.jlpt) : state.all;
  if (state.query) {
    const q = state.query;
    // Kana (hiragana or katakana) → match on/kun readings; otherwise → match meanings
    if (/[぀-ヿ]/.test(q)) {
      base = base.filter(k => k.on.some(r => r.includes(q)) || k.kun.some(r => r.includes(q)));
    } else {
      const lower = q.toLowerCase();
      base = base.filter(k => k.m.some(m => m.toLowerCase().includes(lower)));
    }
  }
  return sortBy(base, state.sortField, state.sortAsc);
}

function updateSortButtons() {
  const labels = { r: 'RTK', s: 'Strokes', j: 'JLPT' };
  document.querySelectorAll('.sort-btn').forEach(b => {
    const isActive = b.dataset.sort === state.sortField;
    b.classList.toggle('sort-btn-active', isActive);
    b.textContent = isActive
      ? `${labels[b.dataset.sort]} ${state.sortAsc ? '↑' : '↓'}`
      : labels[b.dataset.sort];
  });
}

function render() {
  const filtered = getFiltered();
  const countEl = document.getElementById('browse-count');
  const gridEl = document.getElementById('kanji-grid');
  if (!countEl || !gridEl) return;

  countEl.textContent = `${filtered.length.toLocaleString()} kanji`;

  if (filtered.length === 0) {
    gridEl.innerHTML = '<span class="browse-status">No kanji match these filters.</span>';
    return;
  }

  gridEl.innerHTML = filtered.map(k => {
    const meaning = k.m[0] ?? '';
    return `<button class="kanji-card" data-char="${esc(k.c)}" aria-label="${esc(k.c)} — ${esc(meaning)}">
      <span class="kanji">${esc(k.c)}</span>
      <span class="kanji-card-meaning">${esc(meaning)}</span>
    </button>`;
  }).join('');

  state.selected = null;
  renderDetail();
}

function renderDetail() {
  const drawer = document.getElementById('detail-drawer');
  if (!drawer) return;

  if (!state.selected) {
    drawer.classList.remove('detail-drawer-open');
    drawer.innerHTML = '';
    return;
  }

  const k = state.selected;
  const on = k.on.length ? k.on.join('、') : '—';
  const kun = k.kun.length ? k.kun.join('、') : '—';
  const meanings = k.m.length ? k.m.map(esc).join(', ') : '—';

  drawer.classList.add('detail-drawer-open');
  drawer.innerHTML = `
    <div class="detail-inner">
      <button class="detail-close" aria-label="Close detail">✕</button>
      <div class="detail-header">
        <span class="detail-char kanji">${esc(k.c)}</span>
        <div class="detail-tags">
          ${k.j != null ? `<span class="tag">N${k.j}</span>` : ''}
          ${k.s != null ? `<span class="tag">${k.s} strokes</span>` : ''}
          ${k.r != null ? `<span class="tag">RTK #${k.r}</span>` : ''}
        </div>
      </div>
      <p class="detail-meanings">${meanings}</p>
      <div class="detail-readings">
        <div class="reading-row">
          <span class="reading-label">On</span>
          <span class="kanji">${esc(on)}</span>
        </div>
        <div class="reading-row">
          <span class="reading-label">Kun</span>
          <span class="kanji">${esc(kun)}</span>
        </div>
      </div>
      <a class="detail-more-link" href="#/kanji/${encodeURIComponent(k.c)}">View full details →</a>
    </div>
  `;
}
