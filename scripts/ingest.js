import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CC BY-SA — see README in source repo and docs/data-schema.md
const SOURCE_URL =
  'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json';

const OUT_PATH = path.resolve(fileURLToPath(import.meta.url), '../../public/data/kanji.json');

function download(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const request = (u) => {
      https
        .get(
          u,
          { headers: { 'User-Agent': 'kanji-study/ingest (+https://github.com/nmcginn/kanji-study)' } },
          (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
              request(res.headers.location);
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode} for ${u}`));
              return;
            }
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', reject);
          }
        )
        .on('error', reject);
    };
    request(url);
  });
}

function transform(raw) {
  // Source format: object keyed by kanji character, values have strokes, jlpt_new,
  // meanings, readings_on, readings_kun. No RTK frame numbers in this source —
  // r field will be null until a Heisig supplement is added (see docs/data-schema.md).
  return Object.entries(raw).map(([char, entry]) => ({
    c: char,
    s: entry.strokes ?? null,
    j: entry.jlpt_new ?? null,
    r: null,
    m: (entry.meanings ?? []).map((s) =>
      // Strip WaniKani non-primary (^) and non-accepted (!) prefixes
      s.replace(/^[!^]/, '')
    ),
    on: entry.readings_on ?? [],
    kun: entry.readings_kun ?? [],
  }));
}

async function main() {
  console.log('Downloading kanji data…');
  const raw = JSON.parse(await download(SOURCE_URL));
  console.log(`Downloaded ${Object.keys(raw).length} entries`);

  const entries = transform(raw);

  const jlptCount = entries.filter((e) => e.j != null).length;
  console.log(`Entries: ${entries.length}`);
  console.log(`  With JLPT level: ${jlptCount}`);
  console.log(`  Without JLPT:    ${entries.length - jlptCount}`);

  fs.writeFileSync(OUT_PATH, JSON.stringify(entries));
  const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(0);
  console.log(`Written to public/data/kanji.json (${kb} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
