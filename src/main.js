import { browseView } from './views/browse.js';
import { drillView } from './views/drill.js';
import { settingsView } from './views/settings.js';

const routes = {
  '/': homeView,
  '/browse': browseView,
  '/drill': drillView,
  '/settings': settingsView,
};

function homeView() {
  return `
    <section class="home">
      <h1 class="kanji" style="font-size:4rem;margin-bottom:var(--spacing-sm)">漢字</h1>
      <p>Study kanji using the RTK keyword method, ordered your way.</p>
      <div style="display:flex;gap:var(--spacing-md);margin-top:var(--spacing-lg)">
        <a href="#/browse" class="btn">Browse Kanji</a>
        <a href="#/drill" class="btn btn-accent">Start Drilling</a>
      </div>
    </section>
  `;
}

function navigate() {
  const hash = location.hash.slice(1) || '/';
  const view = routes[hash] ?? notFoundView;
  const result = view();
  if (typeof result === 'string') {
    document.getElementById('app').innerHTML = result;
  } else {
    document.getElementById('app').innerHTML = result.html;
    result.init?.();
  }
  updateActiveNav(hash);
}

function updateActiveNav(path) {
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href').slice(1) || '/';
    a.classList.toggle('active', href === path);
  });
}

function notFoundView() {
  return '<p>Page not found.</p>';
}

window.addEventListener('hashchange', navigate);
navigate();
