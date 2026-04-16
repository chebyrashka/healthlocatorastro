<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { buildSearchUrl, parseLocationKeyword } from '../../lib/search-client.js';
import { useSearchStore } from '../../stores/search';

const props = defineProps({
  specialties: {
    type: Array,
    default: () => [],
  },
  initialSearchType: {
    type: String,
    default: 'city',
  },
  initialKeyword: {
    type: String,
    default: '',
  },
  initialSpecialty: {
    type: String,
    default: '',
  },
});

const store = useSearchStore();
const { searchType, keyword, specialty, error } = storeToRefs(store);

const suggestions = ref([]);
const isLoadingSuggestions = ref(false);
let suggestionsRequest = 0;

watch(
  () => [props.initialSearchType, props.initialKeyword, props.initialSpecialty],
  () => {
    store.hydrate({
      searchType: props.initialSearchType,
      keyword: props.initialKeyword,
      specialty: props.initialSpecialty,
    });
    suggestions.value = [];
  },
  { immediate: true },
);

const label = computed(() => {
  if (searchType.value === 'hospital') {
    return 'Hospital name';
  }

  if (searchType.value === 'care') {
    return 'City, two-letter state or zip code';
  }

  return 'City, two-letter state or zip code';
});

const placeholder = computed(() => {
  if (searchType.value === 'hospital') {
    return 'Enter hospital name';
  }

  return 'Boston, MA';
});

const helperText = computed(() => {
  if (searchType.value === 'hospital') {
    return 'Search by hospital name and choose the best match.';
  }

  if (searchType.value === 'care') {
    return 'Pick a care type, then enter a city and state or a zip code.';
  }

  return 'Use city name followed by the 2-letter state abbreviation or use a zip code.';
});

async function fetchSuggestions(value) {
  const requestId = ++suggestionsRequest;
  const trimmed = value.trim();

  if (trimmed.length < 3) {
    suggestions.value = [];
    return;
  }

  isLoadingSuggestions.value = true;

  try {
    const endpoint =
      searchType.value === 'hospital'
        ? `/api/gethospitals?q=${encodeURIComponent(trimmed)}`
        : `/api/getcities?q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      if (requestId === suggestionsRequest) {
        suggestions.value = [];
      }

      return;
    }

    const rows = await response.json();

    if (requestId === suggestionsRequest) {
      suggestions.value = Array.isArray(rows) ? rows : [];
    }
  } catch {
    if (requestId === suggestionsRequest) {
      suggestions.value = [];
    }
  } finally {
    if (requestId === suggestionsRequest) {
      isLoadingSuggestions.value = false;
    }
  }
}

async function handleInput(event) {
  const value = event.target.value;
  store.setKeyword(value);
  await fetchSuggestions(value);
}

function handleTypeChange(type) {
  store.setSearchType(type);
  suggestions.value = [];
}

function goTo(url) {
  if (url) {
    window.location.assign(url);
  }
}

async function resolveCityKeyword(raw) {
  const parsed = parseLocationKeyword(raw);

  if (parsed.isZip) {
    return raw.trim();
  }

  if (!parsed.city) {
    return null;
  }

  const response = await fetch(`/api/getcities?q=${encodeURIComponent(parsed.city.trim())}`);

  if (!response.ok) {
    return null;
  }

  const rows = await response.json();

  if (!Array.isArray(rows) || !rows.length) {
    return null;
  }

  if (parsed.state) {
    const exact = rows.find((row) => (row.state || '').toLowerCase() === parsed.state.toLowerCase());

    if (exact?.label) {
      return exact.label;
    }
  }

  return rows[0]?.label ?? null;
}

async function handleSearch() {
  const trimmedKeyword = keyword.value.trim();

  store.clearError();

  if (searchType.value !== 'hospital' && !trimmedKeyword) {
    store.setError('Error: please use city name followed by the 2-letter state abbreviation or use the zip code');
    return;
  }

  if (searchType.value === 'care') {
    if (!specialty.value) {
      store.setError('Error: select a specialty before searching.');
      return;
    }

    const resolved = await resolveCityKeyword(trimmedKeyword);

    if (!resolved) {
      store.setError('Error: please use city name followed by the 2-letter state abbreviation or use the zip code');
      return;
    }

    store.setKeyword(resolved);
    goTo(buildSearchUrl({ type: 'care', keyword: resolved, specialty: specialty.value }));
    return;
  }

  if (searchType.value === 'city') {
    const parsed = parseLocationKeyword(trimmedKeyword);

    if (parsed.isZip) {
      goTo(buildSearchUrl({ type: 'city', keyword: trimmedKeyword }));
      return;
    }

    const resolved = await resolveCityKeyword(trimmedKeyword);

    if (!resolved) {
      store.setError(`Sorry — we couldn’t find a match for “${trimmedKeyword}”. Try “City, ST” or a zip code.`);
      return;
    }

    store.setKeyword(resolved);
    goTo(buildSearchUrl({ type: 'city', keyword: resolved }));
    return;
  }

  const directUrl = buildSearchUrl({ type: 'hospital', keyword: trimmedKeyword });

  if (directUrl) {
    goTo(directUrl);
    return;
  }

  try {
    const response = await fetch(`/api/gethospitals?q=${encodeURIComponent(trimmedKeyword)}`);
    const rows = response.ok ? await response.json() : [];
    const first = rows?.[0];

    if (first?.id) {
      goTo(`/location/${first.id}`);
      return;
    }
  } catch {
    // fall through to error
  }

  store.setError(`Sorry — we couldn’t find a hospital match for “${trimmedKeyword}”.`);
}

async function handleSuggestionClick(suggestion) {
  store.clearError();
  suggestions.value = [];

  if (searchType.value === 'hospital') {
    store.setKeyword(suggestion.label);
    goTo(`/location/${suggestion.id}`);
    return;
  }

  store.setKeyword(suggestion.label);

  if (searchType.value === 'care') {
    if (!specialty.value) {
      store.setError('Error: select a specialty before searching.');
      return;
    }

    goTo(buildSearchUrl({ type: 'care', keyword: suggestion.label, specialty: specialty.value }));
    return;
  }

  goTo(buildSearchUrl({ type: 'city', keyword: suggestion.label }));
}

const visibleSuggestions = computed(() => suggestions.value.slice(0, 8));
</script>

<template>
  <section class="search-shell">
    <div class="toggle">
      <label>
        <input
          :checked="searchType === 'city'"
          class="sr-only"
          name="search-type"
          type="radio"
          value="city"
          @change="handleTypeChange('city')"
        />
        City
      </label>

      <label>
        <input
          :checked="searchType === 'care'"
          class="sr-only"
          name="search-type"
          type="radio"
          value="care"
          @change="handleTypeChange('care')"
        />
        Specialty
      </label>

      <label>
        <input
          :checked="searchType === 'hospital'"
          class="sr-only"
          name="search-type"
          type="radio"
          value="hospital"
          @change="handleTypeChange('hospital')"
        />
        Hospital
      </label>
    </div>

    <form class="search-form" @submit.prevent="handleSearch">
      <div v-if="searchType === 'care'" class="field field--specialty">
        <label for="specialty">Specialized care</label>
        <select id="specialty" :value="specialty" required @change="store.setSpecialty($event.target.value)">
          <option value="">Select an option</option>
          <option
            v-for="item in props.specialties"
            :key="item.mapto"
            :value="item.mapto"
          >
            {{ item.label }}
          </option>
        </select>
      </div>

      <div class="field field--keyword" :data-has-error="error ? 'true' : 'false'">
        <label for="keyword">{{ label }}</label>
        <input
          id="keyword"
          :placeholder="placeholder"
          :value="keyword"
          autocomplete="off"
          type="text"
          @focus="fetchSuggestions(keyword)"
          @input="handleInput"
        />

        <div v-if="visibleSuggestions.length" class="suggestions">
          <button
            v-for="suggestion in visibleSuggestions"
            :key="suggestion.id || suggestion.label"
            type="button"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion.label }}
          </button>
        </div>
      </div>

      <button type="submit">
        Explore hospitals
      </button>
    </form>

    <p class="helper">
      {{ isLoadingSuggestions ? 'Loading suggestions...' : helperText }}
    </p>
    <p v-if="error" class="error">
      {{ error }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.search-shell {
  padding: 1.5rem;
  border-radius: 2rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 30px 60px rgba(3, 12, 183, 0.12);
}

.toggle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1rem;

  label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.6rem;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    background: rgba(85, 98, 252, 0.08);
    color: var(--color-blue--3);
    font-weight: 800;
    transition: background-color 160ms ease;

    &:has(input:checked) {
      background: var(--color-blue--1);
      color: var(--color-white);
    }
  }
}

.search-form {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.45rem;

  label {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-blue--4);
  }

  input,
  select {
    min-height: 3.4rem;
    padding: 0.85rem 1rem;
    border-radius: 1rem;
    border: 1px solid rgba(14, 16, 47, 0.12);
    background: white;
  }

  input:focus,
  select:focus {
    border-color: var(--color-blue--1);
    outline: 3px solid rgba(85, 98, 252, 0.12);
  }
}

.field--keyword {
  position: relative;

  &[data-has-error='true'] input {
    border-color: var(--color-red--1);
  }
}

.suggestions {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 5;
  display: grid;
  gap: 0.35rem;
  padding: 0.75rem;
  border-radius: 1.25rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 18px 34px rgba(14, 16, 47, 0.12);

  button {
    min-height: 2.8rem;
    padding: 0.75rem 0.9rem;
    text-align: left;
    border-radius: 0.85rem;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-weight: 700;

    &:hover,
    &:focus-visible {
      background: rgba(85, 98, 252, 0.08);
      outline: none;
    }
  }
}

button[type='submit'] {
  min-height: 3.6rem;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--color-blue--1), var(--color-blue--3));
  color: var(--color-white);
  font-weight: 800;
  letter-spacing: 0.01em;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(14, 16, 47, 0.16);
    outline: none;
  }
}

.helper,
.error {
  margin-top: 0.85rem;
  font-size: 0.92rem;
  line-height: 1.5;
  text-align: center;
}

.helper {
  color: color-mix(in srgb, var(--color-text) 72%, white);
}

.error {
  color: var(--color-red--1);
  font-weight: 700;
}

@media (min-width: 900px) {
  .search-form {
    grid-template-columns: 1.2fr 1.8fr auto;
    align-items: start;
  }

  .field--specialty,
  .field--keyword {
    min-width: 0;
  }
}
</style>
