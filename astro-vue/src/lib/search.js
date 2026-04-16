import zipcodes from 'zipcodes';

import { queryHospitalSuggestions } from './hospital-search.js';
import { deriveInitialSearchState, formatKeyword, parseLocationKeyword } from './search-client.js';
import { getCities, getLocations, getSpecialtyLabel, getStateName } from './site-data.js';

export const DEFAULT_RADIUS = 25;

const normalize = (value = '') => String(value || '').trim().toLowerCase();
const numberOrNull = (value) => {
  if (value === '' || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 3958.8 * c;
}

export async function resolveCityMatch(raw = '') {
  const parsed = parseLocationKeyword(raw);

  if (parsed.isZip || !parsed.city || parsed.city.trim().length < 2) {
    return null;
  }

  const cities = await getCities();

  const results = cities
    .filter((cityObj) => cityObj.city.toLowerCase().startsWith(parsed.city.toLowerCase()))
    .sort((a, b) => {
      if (a.city.toLowerCase() === b.city.toLowerCase()) {
        return a.state.localeCompare(b.state);
      }

      return a.city.localeCompare(b.city);
    });

  if (!results.length) {
    return null;
  }

  if (parsed.state) {
    return results.find((item) => item.state.toLowerCase() === parsed.state.toLowerCase()) ?? null;
  }

  return results[0];
}

function sortRows(rows) {
  rows.sort((a, b) => {
    const scoreDiff = Number(b.s_mcvi || 0) - Number(a.s_mcvi || 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export async function resolveSearchContext({
  by = 'city',
  city = '',
  state = '',
  zip = '',
  hospital = '',
  specialty = '',
  lat = null,
  lng = null,
} = {}) {
  const context = {
    by,
    city: String(city || ''),
    state: String(state || ''),
    zip: String(zip || ''),
    hospital: String(hospital || ''),
    specialty: String(specialty || ''),
    lat: numberOrNull(lat),
    lng: numberOrNull(lng),
    routeVariant: 'search',
  };

  if (context.by === 'care' && context.specialty) {
    context.routeVariant = 'care-search';
  } else if (context.state && !context.city && !context.zip) {
    context.routeVariant = 'state';
  }

  if (context.city) {
    const match = await resolveCityMatch(formatKeyword({ city: context.city, state: context.state }));

    if (match) {
      context.city = match.city;
      context.state = match.state;
      context.lat = Number(match.lat);
      context.lng = Number(match.lng);
    }
  }

  return context;
}

export async function searchLocations({
  by = 'city',
  city = '',
  state = '',
  zip = '',
  hospital = '',
  specialty = '',
  lat = null,
  lng = null,
  radius = DEFAULT_RADIUS,
  excellence = false,
  hvOn = false,
  lmOn = false,
  limit,
  } = {}) {
  const locations = await getLocations();
  let rows = [];
  let resolvedLat = numberOrNull(lat);
  let resolvedLng = numberOrNull(lng);
  let hasGeo = resolvedLat != null && resolvedLng != null;

  if (!hasGeo && zip) {
    const info = zipcodes.lookup(String(zip));

    if (info) {
      resolvedLat = info.latitude;
      resolvedLng = info.longitude;
      hasGeo = true;
    }
  } else if (!hasGeo && city) {
    const match = await resolveCityMatch(formatKeyword({ city, state }));

    if (match?.lat != null && match?.lng != null) {
      resolvedLat = Number(match.lat);
      resolvedLng = Number(match.lng);
      hasGeo = true;
    }
  }

  if (hospital) {
    const suggestions = await queryHospitalSuggestions(hospital, 50);
    const suggestionIds = new Set(suggestions.map((item) => String(item.id)));
    rows = locations.filter((location) => suggestionIds.has(String(location.id)));
  } else if (hasGeo) {
    rows = locations
      .map((location) => ({
        ...location,
        distance: getDistance(resolvedLat, resolvedLng, Number(location.lat), Number(location.lng)),
      }))
      .filter((location) => location.distance <= Number(radius || DEFAULT_RADIUS));
  } else if (city) {
    rows = locations.filter(
      (location) =>
        normalize(location.city) === normalize(city) &&
        (!state || normalize(location.state) === normalize(state)),
    );
  } else if (state) {
    rows = locations.filter((location) => normalize(location.state) === normalize(state));
  } else {
    rows = [...locations];
  }

  if (specialty && hvOn) {
    rows = rows.filter((location) => Number(location[`hv_${specialty}`]) === 1);
  }

  if (specialty && lmOn) {
    rows = rows.filter((location) => Number(location[`lm_${specialty}`]) === 1);
  }

  if (specialty) {
    rows = rows.filter((location) => Number(location[`v_${specialty}`]) > -1);
  }

  if (excellence) {
    rows = rows.filter((location) => Number(location.excellence) === 1);
  }

  sortRows(rows);

  if (rows.length > 5000) {
    return [];
  }

  if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
    return rows.slice(0, Number(limit));
  }

  return rows;
}

export async function buildSearchSummary({
  by = 'city',
  city = '',
  state = '',
  zip = '',
  hospital = '',
  specialty = '',
} = {}) {
  if (hospital) {
    return {
      title: `Hospital matches for "${hospital}"`,
      description: 'Search suggestions and direct hospital navigation are now running through the Astro + Vue app.',
    };
  }

  if (state && !city && !zip) {
    const stateName = await getStateName(state);
    return {
      title: `Hospitals in ${stateName ?? state.toUpperCase()}`,
      description: 'State-level search is now served from the Astro migration app using the shared hospital dataset.',
    };
  }

  if (by === 'care' || specialty) {
    const specialtyLabel = await getSpecialtyLabel(specialty);

    if (zip) {
      return {
        title: `${specialtyLabel ?? 'Specialty care'} near ${zip}`,
        description: 'Specialty-first search now supports zip and city lookups in the Astro app.',
      };
    }

    if (city) {
      return {
        title: `${specialtyLabel ?? 'Specialty care'} near ${formatKeyword({ city, state })}`,
        description: 'Specialty-first search now supports zip and city lookups in the Astro app.',
      };
    }

    return {
      title: specialtyLabel ?? 'Specialty care',
      description: 'Search behavior is now aligned with the existing app query contract.',
    };
  }

  if (zip) {
    return {
      title: `Hospitals near ${zip}`,
      description: 'Zip-based proximity search is now running through the Astro migration app.',
    };
  }

  if (city) {
    return {
      title: `Hospitals near ${formatKeyword({ city, state })}`,
      description: 'City search now validates and canonicalizes location input in the Astro app.',
    };
  }

  return {
    title: 'Search results',
    description: 'Search routing is now aligned between the Astro and Next app shapes.',
  };
}

export { deriveInitialSearchState };
