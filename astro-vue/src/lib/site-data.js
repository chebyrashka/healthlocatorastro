import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const cache = new Map();

const dataCandidates = (name) => [
  new URL(`../../../data/${name}`, import.meta.url),
  new URL(`../../data/${name}`, import.meta.url),
  join(process.cwd(), 'data', name),
  join(process.cwd(), '..', 'data', name),
];

const readJson = async (name) => {
  if (cache.has(name)) {
    return cache.get(name);
  }

  for (const candidate of dataCandidates(name)) {
    try {
      const raw = await readFile(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      cache.set(name, parsed);
      return parsed;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  throw new Error(`Unable to locate data file: ${name}`);
};

export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export async function getSiteContent() {
  const [content] = await readJson('staticcontent.json');
  return content;
}

export async function getLocations() {
  return readJson('locations.json');
}

export async function getCities() {
  const raw = await readJson('cities.json');

  return raw.map(({ c, s, city, state, ...rest }) => ({
    ...rest,
    city: String(city ?? c ?? ''),
    state: String(state ?? s ?? ''),
  }));
}

export async function getStates() {
  return readJson('states.json');
}

export async function getProcedures() {
  return readJson('procedures.json');
}

export async function getNationalData() {
  const [national] = await readJson('national.json');
  return national;
}

export async function getBedBuckets() {
  return readJson('beds_buckets.json');
}

export async function getStateName(abbreviation = '') {
  const states = await getStates();
  const match = states.find((state) => state.abbreviation === String(abbreviation).toUpperCase());
  return match?.name ?? null;
}

export async function getSpecialtyLabel(mapto = '') {
  const procedures = await getProcedures();
  const specialties = procedures?.[1]?.specialties ?? [];
  const match = specialties.find((item) => item.mapto === mapto);
  return match?.label ?? null;
}

export async function getLocationById(id = '') {
  const locations = await getLocations();
  return locations.find((location) => String(location.id) === String(id)) ?? null;
}
