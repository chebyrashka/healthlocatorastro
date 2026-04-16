export const STATES = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia',
  'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt',
  'va', 'wa', 'wv', 'wi', 'wy', 'dc',
]);

export function parseLocationKeyword(raw = '') {
  const trimmed = String(raw).trim();
  const digits = trimmed.replace(/\D/g, '').slice(0, 5);

  if (digits.length === 5) {
    return { isZip: true, zip: digits, city: '', state: '' };
  }

  let city = '';
  let state = '';

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((part) => part.trim());
    city = parts[0] || '';
    const maybeState = (parts[1] || '').toLowerCase();
    state = STATES.has(maybeState) ? maybeState.toUpperCase() : '';
  } else {
    const parts = trimmed.toLowerCase().split(/\s+/);
    const last = parts.at(-1);

    if (parts.length > 1 && STATES.has(last)) {
      state = last.toUpperCase();
      city = trimmed.slice(0, trimmed.toLowerCase().lastIndexOf(last)).trim();
    } else {
      city = trimmed;
    }
  }

  return { isZip: false, zip: '', city, state };
}

export function formatKeyword({ city = '', state = '', zip = '', hospital = '', searchType = 'city' } = {}) {
  if (searchType === 'hospital') {
    return hospital;
  }

  if (zip) {
    return zip;
  }

  if (city) {
    return state ? `${city}, ${state}` : city;
  }

  return '';
}

export function buildSearchUrl({ type, keyword = '', specialty = '', hospitalId = '' } = {}) {
  if (type === 'hospital') {
    if (hospitalId) {
      return `/location/${hospitalId}`;
    }

    const candidate = String(keyword || '').trim();
    const isAlnum = /^[A-Za-z0-9]+$/.test(candidate);
    const hasDigit = /\d/.test(candidate);

    if (isAlnum && hasDigit) {
      return `/location/${candidate}`;
    }

    return null;
  }

  const params = new URLSearchParams();
  params.set('by', type);

  if (type === 'care' && specialty) {
    params.set('specialty', String(specialty).trim().toLowerCase());
  }

  const parsed = parseLocationKeyword(keyword);

  if (parsed.isZip) {
    params.set('zip', parsed.zip);
  } else {
    if (parsed.city) {
      params.set('city', parsed.city);
    }

    if (parsed.state) {
      params.set('state', parsed.state);
    }
  }

  return `/search?${params.toString()}`;
}

export function deriveInitialSearchState(params) {
  const by = params.get('by') || (params.get('hospital') ? 'hospital' : 'city');
  const specialty = params.get('specialty') || '';
  const city = params.get('city') || '';
  const state = params.get('state') || '';
  const zip = params.get('zip') || '';
  const hospital = params.get('hospital') || '';

  return {
    searchType: by,
    specialty,
    keyword: formatKeyword({
      city,
      state,
      zip,
      hospital,
      searchType: by,
    }),
  };
}
