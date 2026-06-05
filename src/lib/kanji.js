let _cache = null;

export async function loadKanji() {
  if (_cache) return _cache;
  const res = await fetch(`${import.meta.env.BASE_URL}data/kanji.json`);
  if (!res.ok) throw new Error(`Failed to load kanji data: ${res.status}`);
  _cache = await res.json();
  return _cache;
}

export function filterByJlpt(kanji, level) {
  if (!level) return kanji;
  return kanji.filter(k => k.j === level);
}

export function sortBy(kanji, field, ascending = true) {
  const dir = ascending ? 1 : -1;
  return [...kanji].sort((a, b) => {
    const av = a[field] ?? Infinity;
    const bv = b[field] ?? Infinity;
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}
