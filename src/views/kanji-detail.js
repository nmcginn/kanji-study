import { loadKanji } from '../lib/kanji.js';
import { loadProgress, saveProgress, isDue } from '../lib/srs.js';

const RESOURCES = [
  {
    name: 'Jisho',
    desc: 'Popular English–Japanese dictionary with example sentences',
    url: c => `https://jisho.org/search/${encodeURIComponent(c)}%20%23kanji`,
  },
  {
    name: 'Wiktionary',
    desc: 'Etymology, stroke order, and usage notes',
    url: c => `https://en.wiktionary.org/wiki/${encodeURIComponent(c)}`,
  },
  {
    name: 'Wanikani',
    desc: 'Mnemonics and curated example vocabulary',
    url: c => `https://www.wanikani.com/kanji/${encodeURIComponent(c)}`,
  },
  {
    name: 'Kanshudo',
    desc: 'Comprehensive kanji reference with compounds and context',
    url: c => `https://www.kanshudo.com/kanji/${encodeURIComponent(c)}`,
  },
  {
    name: 'Weblio',
    desc: '日本語の辞書・用例 (Japanese-language dictionary)',
    url: c => `https://www.weblio.jp/content/${encodeURIComponent(c)}`,
  },
];

export function kanjiDetailView(char) {
  return {
    html: `<div id="kanji-detail-root"><span class="browse-status">Loading…</span></div>`,
    init: () => initKanjiDetail(char),
  };
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function srsBodyHtml(char) {
  const progress = loadProgress();
  const state = progress[char];
  if (!state) {
    return `<p class="srs-unseen">This kanji hasn't been studied in drill mode yet.</p>`;
  }
  const isDueNow = isDue(state);
  const dueText = isDueNow ? 'due now' : `next review ${state.due}`;
  return `
    <div class="srs-row">
      <span class="tag ${isDueNow ? 'tag--due' : 'tag--known'}">${isDueNow ? 'Due' : 'Up to date'}</span>
      <span class="srs-detail">${state.reps} review${state.reps !== 1 ? 's' : ''} · ${state.interval}d interval · ${dueText}</span>
    </div>
    <button class="btn srs-forget-btn" id="srs-forget-btn">Forget this kanji</button>
  `;
}

async function initKanjiDetail(char) {
  const root = document.getElementById('kanji-detail-root');
  if (!root) return;

  let kanji;
  try {
    const all = await loadKanji();
    kanji = all.find(k => k.c === char);
  } catch {
    root.innerHTML = '<span class="browse-status">Failed to load kanji data.</span>';
    return;
  }

  if (!kanji) {
    root.innerHTML = `<span class="browse-status">Kanji "${esc(char)}" not found.</span>`;
    return;
  }

  const k = kanji;
  const on = k.on.length ? k.on.join('、') : '—';
  const kun = k.kun.length ? k.kun.join('、') : '—';
  const meanings = k.m.length ? k.m.map(esc).join(', ') : '—';

  const resourceLinks = RESOURCES.map(r => `
    <a class="resource-card" href="${esc(r.url(char))}" target="_blank" rel="noopener noreferrer">
      <span class="resource-name">${esc(r.name)}</span>
      <span class="resource-desc">${esc(r.desc)}</span>
    </a>
  `).join('');

  root.addEventListener('click', e => {
    const body = document.getElementById('srs-body');
    if (!body) return;
    if (e.target.id === 'srs-forget-btn') {
      body.innerHTML = `
        <p class="srs-confirm-text">Reset study progress for 「${esc(k.c)}」? This cannot be undone.</p>
        <div class="srs-confirm-actions">
          <button class="btn btn-danger" id="srs-confirm-yes">Reset progress</button>
          <button class="btn" id="srs-confirm-no">Cancel</button>
        </div>
      `;
    } else if (e.target.id === 'srs-confirm-yes') {
      const progress = loadProgress();
      delete progress[char];
      saveProgress(progress);
      body.innerHTML = srsBodyHtml(char);
    } else if (e.target.id === 'srs-confirm-no') {
      body.innerHTML = srsBodyHtml(char);
    }
  });

  root.innerHTML = `
    <div class="kanji-detail">
      <a class="back-link" href="#/browse">← Back to browse</a>
      <div class="kanji-detail-hero">
        <span class="kanji-detail-char kanji">${esc(k.c)}</span>
        <div class="kanji-detail-meta">
          <div class="detail-tags">
            ${k.j != null ? `<span class="tag">N${k.j}</span>` : ''}
            ${k.s != null ? `<span class="tag">${k.s} strokes</span>` : ''}
            ${k.r != null ? `<span class="tag">RTK #${k.r}</span>` : ''}
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
        </div>
      </div>
      <section class="resource-section">
        <h2 class="resource-section-title">External resources</h2>
        <div class="resource-grid">
          ${resourceLinks}
        </div>
      </section>
      <section class="srs-section">
        <h2 class="resource-section-title">Study progress</h2>
        <div id="srs-body">${srsBodyHtml(char)}</div>
      </section>
    </div>
  `;
}
