import { readFile, stat } from 'node:fs/promises';

import { getLocations } from './site-data.js';

function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_PHRASES = [
  'medical center',
  'med center',
  'regional medical center',
  'hospital',
  'health',
  'health system',
  'clinic',
  'system',
  'center',
];

const COMPASS = [
  ['northwest', 'nw'],
  ['northeast', 'ne'],
  ['southwest', 'sw'],
  ['southeast', 'se'],
  ['north west', 'nw'],
  ['north east', 'ne'],
  ['south west', 'sw'],
  ['south east', 'se'],
  ['north', 'n'],
  ['south', 's'],
  ['east', 'e'],
  ['west', 'w'],
];

const MANUAL = {
  'se alabama': '010001',
  'university of connecticut': '070036',
};

function removeStopPhrases(value) {
  let output = String(value || '').toLowerCase();

  for (const phrase of STOP_PHRASES) {
    output = output.replace(new RegExp(`\\b${phrase}\\b`, 'g'), ' ');
  }

  return normalize(output);
}

function applyCompassAbbrev(value) {
  let output = String(value || '').toLowerCase();

  for (const [full, abbr] of COMPASS) {
    output = output.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }

  return normalize(output);
}

function acronym(value) {
  const words = normalize(value)
    .split(' ')
    .filter((word) => word && !['of', 'the', 'and'].includes(word));

  return words.map((word) => word[0]).join('');
}

function generateAliases(title, city, state) {
  const safeTitle = String(title || '');
  const safeCity = String(city || '');
  const safeState = String(state || '');
  const variants = new Set();

  const base = normalize(safeTitle);
  const stripped = removeStopPhrases(safeTitle);
  const comp1 = applyCompassAbbrev(safeTitle);
  const comp2 = applyCompassAbbrev(stripped);

  if (base) variants.add(base);
  if (stripped) variants.add(stripped);
  if (comp1) variants.add(comp1);
  if (comp2) variants.add(comp2);

  const ac1 = acronym(safeTitle);
  const ac2 = acronym(stripped);

  if (ac1) variants.add(ac1);
  if (ac2) variants.add(ac2);
  if (safeCity) variants.add(normalize(`${stripped || safeTitle} ${safeCity}`));
  if (safeState) variants.add(normalize(`${stripped || safeTitle} ${safeState}`));
  if (safeCity && safeState) variants.add(normalize(`${stripped || safeTitle} ${safeCity} ${safeState}`));
  if (safeCity) variants.add(normalize(`${stripped || safeTitle} in ${safeCity}`));

  const words = (stripped || base).split(' ').filter(Boolean);

  if (words.length >= 2) {
    variants.add(applyCompassAbbrev(words.slice(0, 2).join(' ')));
  }

  return Array.from(variants).filter(Boolean);
}

function buildAliasIndex(locations, externalRecords) {
  const map = new Map();

  const add = (alias, id) => {
    const key = normalize(alias);
    const sid = String(id);

    if (!key || !sid) {
      return;
    }

    const list = map.get(key);

    if (list) {
      if (!list.includes(sid)) {
        list.push(sid);
      }
    } else {
      map.set(key, [sid]);
    }
  };

  for (const location of locations) {
    if (!location?.id || !location?.title) {
      continue;
    }

    const sid = String(location.id);

    for (const alias of generateAliases(location.title, location.city, location.state) || []) {
      add(alias, sid);
    }

    if (location.city) add(`${location.title} ${location.city}`, sid);
    if (location.state) add(`${location.title} ${location.state}`, sid);
    add(location.title, sid);
  }

  for (const [alias, id] of Object.entries(MANUAL)) {
    add(alias, id);
  }

  if (Array.isArray(externalRecords)) {
    for (const record of externalRecords) {
      add(record.name, record.id);

      for (const alias of record.aliases || []) {
        add(alias, record.id);
      }
    }
  }

  return map;
}

function findByAliasExact(indexMap, query) {
  return indexMap.get(normalize(query)) || null;
}

function findByAliasLoose(indexMap, query) {
  const q = normalize(query);

  if (!q) {
    return null;
  }

  const output = new Set();

  for (const [alias, ids] of indexMap.entries()) {
    if (alias.startsWith(q)) {
      ids.forEach((id) => output.add(id));
    }
  }

  if (output.size) {
    return Array.from(output);
  }

  const tokens = q.split(' ').filter(Boolean);

  if (!tokens.length) {
    return null;
  }

  for (const [alias, ids] of indexMap.entries()) {
    if (tokens.every((token) => alias.includes(token))) {
      ids.forEach((id) => output.add(id));
    }
  }

  return output.size ? Array.from(output) : null;
}

const cache = {
  aliasIndex: null,
  idMap: null,
  aliasRecordsMtime: null,
};

async function loadExternalAliasRecords() {
  const fileUrl = new URL('../../../data/hospital-aliases.json', import.meta.url);
  const fileStat = await stat(fileUrl);

  if (cache.aliasRecordsMtime === fileStat.mtimeMs && cache.externalRecords) {
    return cache.externalRecords;
  }

  const raw = await readFile(fileUrl, 'utf8');
  const parsed = JSON.parse(raw);

  cache.externalRecords = Array.isArray(parsed)
    ? parsed
        .map((record) => ({
          id: String(record?.id ?? ''),
          name: String(record?.name ?? ''),
          aliases: Array.isArray(record?.aliases) ? record.aliases.map(String) : [],
        }))
        .filter((record) => record.id && record.name)
    : [];
  cache.aliasRecordsMtime = fileStat.mtimeMs;

  return cache.externalRecords;
}

async function ensureIndex() {
  const locations = await getLocations();

  if (!cache.idMap) {
    cache.idMap = new Map(locations.map((location) => [String(location.id), location]));
  }

  const externalRecords = await loadExternalAliasRecords();

  if (!cache.aliasIndex) {
    cache.aliasIndex = buildAliasIndex(locations, externalRecords);
  }

  return { aliasIndex: cache.aliasIndex, idMap: cache.idMap, locations };
}

export async function queryHospitalSuggestions(query = '', limit = 50) {
  const q = String(query || '').trim();

  if (!q) {
    return [];
  }

  const { aliasIndex, idMap, locations } = await ensureIndex();
  const normalizedQuery = normalize(q);

  const exactIds = findByAliasExact(aliasIndex, q) ?? [];
  const looseIds = findByAliasLoose(aliasIndex, q) ?? [];

  const containsIds = locations
    .filter((location) => {
      const haystack = [location?.title, location?.city, location?.state].map(normalize).join(' ');
      return haystack.includes(normalizedQuery);
    })
    .map((location) => String(location.id));

  const allIds = Array.from(new Set([...exactIds.map(String), ...looseIds.map(String), ...containsIds]));
  const all = allIds.map((id) => idMap.get(id)).filter(Boolean);

  function score(location) {
    const normalizedTitle = normalize(location?.title || '');
    let total = 0;

    if (normalizedTitle.startsWith(normalizedQuery)) total += 3;
    if (normalizedTitle.includes(normalizedQuery)) total += 1;
    if (normalizedTitle.includes('clinic ')) total += 2;
    if (normalizedTitle.includes('health system')) total -= 2;

    return total;
  }

  all.sort((a, b) => {
    const aScore = score(a);
    const bScore = score(b);

    if (aScore !== bScore) {
      return bScore - aScore;
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });

  return all.slice(0, limit).map((location) => ({
    type: 'hospital',
    id: location.id,
    label: location.title,
  }));
}
