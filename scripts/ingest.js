import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CC BY-SA — see README in davidluzgouveia/kanji-data and docs/data-schema.md
const SOURCE_URL =
  'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json';

// CC0 — sdcr/heisig-kanjis, 6th-edition frame numbers
const RTK_URL =
  'https://raw.githubusercontent.com/sdcr/heisig-kanjis/master/heisig-kanjis.csv';

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

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

function buildRtkMap(csvText) {
  const rows = parseCsv(csvText);
  const map = new Map();
  for (const row of rows) {
    const frameNum = parseInt(row.id_6th_ed, 10);
    if (row.kanji && !isNaN(frameNum)) {
      map.set(row.kanji, frameNum);
    }
  }
  return map;
}

function transform(raw, rtkMap) {
  return Object.entries(raw).map(([char, entry]) => ({
    c: char,
    s: entry.strokes ?? null,
    j: entry.jlpt_new ?? null,
    r: rtkMap.get(char) ?? null,
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
  const [rawText, rtkCsv] = await Promise.all([
    download(SOURCE_URL),
    download(RTK_URL),
  ]);

  const raw = JSON.parse(rawText);
  console.log(`Downloaded ${Object.keys(raw).length} kanji entries`);

  const rtkMap = buildRtkMap(rtkCsv);
  console.log(`RTK 6th-ed frame numbers loaded: ${rtkMap.size}`);

  const entries = transform(raw, rtkMap);

  const jlptCount = entries.filter((e) => e.j != null).length;
  const rtkCount = entries.filter((e) => e.r != null).length;
  console.log(`Entries: ${entries.length}`);
  console.log(`  With JLPT level:       ${jlptCount}`);
  console.log(`  Without JLPT:          ${entries.length - jlptCount}`);
  console.log(`  With RTK frame number: ${rtkCount}`);
  console.log(`  Without RTK:           ${entries.length - rtkCount}`);

  fs.writeFileSync(OUT_PATH, JSON.stringify(entries));
  const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(0);
  console.log(`Written to public/data/kanji.json (${kb} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
