import { loadProgress, saveProgress, isDue } from '../lib/srs.js';

export function settingsView() {
  return {
    html: `
      <section class="settings">
        <h2>Settings</h2>
        <div class="settings-group">
          <h3 class="settings-group-title">Progress</h3>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Reset all progress</div>
              <div class="settings-row-desc" id="settings-reset-desc">Loading…</div>
            </div>
            <div id="settings-reset-area"></div>
          </div>
        </div>
      </section>
    `,
    init: initSettings,
  };
}

function descText(progress) {
  const total = Object.keys(progress).length;
  if (total === 0) return 'No progress data to reset.';
  const due = Object.values(progress).filter(isDue).length;
  const dueNote = due > 0 ? ` (${due} due for review)` : '';
  return `${total} kanji studied${dueNote}. Clears all SRS data.`;
}

function showResetBtn(area, progress) {
  const disabled = Object.keys(progress).length === 0 ? ' disabled' : '';
  area.innerHTML = `<button class="btn" id="settings-reset-btn"${disabled}>Reset</button>`;
}

function initSettings() {
  let progress = loadProgress();
  const desc = document.getElementById('settings-reset-desc');
  const area = document.getElementById('settings-reset-area');
  if (!desc || !area) return;

  desc.textContent = descText(progress);
  showResetBtn(area, progress);

  document.querySelector('.settings')?.addEventListener('click', e => {
    if (e.target.id === 'settings-reset-btn') {
      const total = Object.keys(progress).length;
      area.innerHTML = `
        <div class="settings-confirm">
          <span class="settings-confirm-text">Reset ${total} kanji?</span>
          <button class="btn btn-danger" id="settings-confirm-yes">Confirm</button>
          <button class="btn" id="settings-confirm-no">Cancel</button>
        </div>
      `;
    } else if (e.target.id === 'settings-confirm-yes') {
      saveProgress({});
      progress = {};
      desc.textContent = 'Progress cleared.';
      showResetBtn(area, progress);
    } else if (e.target.id === 'settings-confirm-no') {
      showResetBtn(area, progress);
    }
  });
}
