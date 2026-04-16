<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import LocationCard from './LocationCard.vue';
import { useResultsStore } from '../../stores/results';

const DEFAULT_RADIUS = 25;

const props = defineProps({
  initialLocations: {
    type: Array,
    default: () => [],
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  procedures: {
    type: Array,
    default: () => [],
  },
  routeContext: {
    type: Object,
    default: () => ({}),
  },
});

const store = useResultsStore();
const {
  city,
  error,
  excellence,
  hvOn,
  lmOn,
  loading,
  locations,
  radius,
  routeVariant,
  specialty,
  state,
  zip,
} = storeToRefs(store);

const filterOpen = ref(false);
const localRadius = ref(DEFAULT_RADIUS);
const openCategory = ref(null);
const shown = ref(props.pageSize);

watch(
  () => [props.initialLocations, props.routeContext],
  () => {
    store.hydrate({
      ...props.routeContext,
      initialLocations: props.initialLocations,
    });
  },
  { immediate: true, deep: true },
);

watch(
  radius,
  (value) => {
    localRadius.value = Number(value || DEFAULT_RADIUS);
  },
  { immediate: true },
);

watch(
  () => [locations.value.length, props.pageSize],
  () => {
    shown.value = props.pageSize;
  },
  { immediate: true },
);

const categories = computed(() => props.procedures?.[0]?.categories ?? []);
const specialties = computed(() => props.procedures?.[1]?.specialties ?? []);

const specialtyLookup = computed(
  () => new Map(specialties.value.map((item) => [String(item.mapto || ''), item])),
);

const specialtyGroups = computed(() => {
  const categoryOrder = categories.value.map((item) => item.id);
  const labelById = new Map(categories.value.map((item) => [item.id, item.label]));
  const grouped = new Map();

  for (const item of specialties.value) {
    const key = item?.category || 'other';

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(item);
  }

  const orderedKeys = [
    ...categoryOrder,
    ...[...grouped.keys()].filter((key) => !labelById.has(key)).sort((a, b) => a.localeCompare(b)),
  ];

  return orderedKeys
    .map((key) => ({
      key,
      label: labelById.get(key) || key,
      items: (grouped.get(key) || []).slice().sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter((group) => group.items.length);
});

const selectedSpecialty = computed(() => specialtyLookup.value.get(specialty.value) || null);

const isStateRoute = computed(() => routeVariant.value === 'state');
const isSpecialtyPageRoute = computed(() => routeVariant.value === 'specialty');
const isCareSearchRoute = computed(() => routeVariant.value === 'care-search');
const isSpecialtyLocked = computed(() => isSpecialtyPageRoute.value || isCareSearchRoute.value);

watch(
  [specialtyGroups, specialty],
  () => {
    if (selectedSpecialty.value?.category) {
      openCategory.value = selectedSpecialty.value.category;
      return;
    }

    if (!openCategory.value && specialtyGroups.value.length) {
      openCategory.value = specialtyGroups.value[0].key;
    }
  },
  { immediate: true, deep: true },
);

const showDistance = computed(() => !isStateRoute.value && !isSpecialtyPageRoute.value);
const showVolume = computed(() => isCareSearchRoute.value || isSpecialtyPageRoute.value);
const showSpecialties = computed(() => !isCareSearchRoute.value && !isSpecialtyPageRoute.value);

const visibleLocations = computed(() => locations.value.slice(0, shown.value));
const remainingCount = computed(() => Math.max(0, locations.value.length - shown.value));

const locationLabel = computed(() => {
  if (zip.value) {
    return zip.value;
  }

  if (city.value && state.value) {
    return `${city.value}, ${state.value}`;
  }

  if (city.value) {
    return city.value;
  }

  if (state.value) {
    return state.value;
  }

  return '';
});

const resultsHeading = computed(() => {
  const count = locations.value.length;
  const specialtyLabel = selectedSpecialty.value?.label;

  if (specialtyLabel && locationLabel.value) {
    return `${count} results for ${specialtyLabel.toLowerCase()} in ${locationLabel.value}`;
  }

  if (specialtyLabel) {
    return `${count} results for ${specialtyLabel.toLowerCase()}`;
  }

  if (locationLabel.value) {
    return `${count} results in ${locationLabel.value}`;
  }

  return `${count} results`;
});

const resultsCaption = computed(() => {
  if (isStateRoute.value) {
    return 'Ranked by overall hospital score';
  }

  if (locationLabel.value) {
    return `Within ${radius.value} miles`;
  }

  return 'Ranked by overall hospital score';
});

const resultStatus = computed(() => {
  if (loading.value) {
    return 'Refreshing results...';
  }

  return `Showing ${Math.min(shown.value, locations.value.length)} of ${locations.value.length}`;
});

const appliedFilters = computed(() => {
  const chips = [];

  if (showDistance.value && Number(radius.value) > 0) {
    chips.push({
      key: 'radius',
      label: `${radius.value} miles`,
      locked: false,
    });
  }

  if (specialty.value) {
    chips.push({
      key: 'specialty',
      label: selectedSpecialty.value?.label || specialty.value,
      locked: isSpecialtyLocked.value,
    });
  }

  if (hvOn.value) {
    chips.push({
      key: 'hv',
      label: 'High procedure volume',
      locked: false,
    });
  }

  if (lmOn.value) {
    chips.push({
      key: 'lm',
      label: 'High 6-month survival',
      locked: false,
    });
  }

  if (excellence.value) {
    chips.push({
      key: 'excellence',
      label: 'Reliable excellence',
      locked: false,
    });
  }

  return chips;
});

async function commitRadius() {
  const next = Number(localRadius.value || DEFAULT_RADIUS);

  if (next !== Number(radius.value || DEFAULT_RADIUS)) {
    await store.setRadius(next);
  }
}

function toggleCategory(key) {
  openCategory.value = openCategory.value === key ? null : key;
}

async function removeFilter(key) {
  if (key === 'radius') {
    localRadius.value = DEFAULT_RADIUS;
    await store.setRadius(DEFAULT_RADIUS);
    return;
  }

  if (key === 'specialty' && !isSpecialtyLocked.value) {
    await store.setSpecialty('');
    return;
  }

  if (key === 'hv') {
    await store.setHVOn(false);
    return;
  }

  if (key === 'lm') {
    await store.setLMOn(false);
    return;
  }

  if (key === 'excellence') {
    await store.setExcellence(false);
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}
</script>

<template>
  <section class="results-experience">
    <div class="results-experience__heading">
      <div>
        <p class="eyebrow">Search results</p>
        <h2>{{ resultsHeading }}</h2>
        <p>{{ resultsCaption }}</p>
      </div>

      <div class="results-experience__status">
        <button
          type="button"
          class="filter-toggle"
          :aria-expanded="filterOpen ? 'true' : 'false'"
          @click="filterOpen = !filterOpen"
        >
          Filters
        </button>
        <span>{{ resultStatus }}</span>
      </div>
    </div>

    <div class="results-experience__layout">
      <aside class="filters-shell" :data-open="filterOpen ? 'true' : 'false'">
        <button class="filters-shell__scrim" type="button" @click="filterOpen = false" />

        <div class="filters-panel">
          <header class="filters-panel__header">
            <div>
              <p class="eyebrow">Refine results</p>
              <h3>Filter by</h3>
            </div>
            <button type="button" class="filters-panel__close" @click="filterOpen = false">
              Close
            </button>
          </header>

          <div class="filters-panel__body">
            <section v-if="showDistance" class="filter-section">
              <header>
                <h4>Distance</h4>
                <span>{{ localRadius }} miles</span>
              </header>

              <input
                v-model="localRadius"
                type="range"
                min="10"
                max="500"
                step="1"
                @change="commitRadius"
                @mouseup="commitRadius"
                @touchend="commitRadius"
              />

              <div class="filter-section__scale">
                <span>10</span>
                <span>500</span>
              </div>
            </section>

            <section v-if="showVolume" class="filter-section">
              <header>
                <h4>Volume and survival</h4>
              </header>

              <div v-if="selectedSpecialty" class="check-grid">
                <label v-if="selectedSpecialty.hv" class="check-option">
                  <input
                    :checked="hvOn"
                    type="checkbox"
                    @change="store.setHVOn($event.target.checked)"
                  />
                  <span>High procedure volume</span>
                </label>

                <label v-if="selectedSpecialty.lm" class="check-option">
                  <input
                    :checked="lmOn"
                    type="checkbox"
                    @change="store.setLMOn($event.target.checked)"
                  />
                  <span>High 6-month survival</span>
                </label>
              </div>

              <p v-else class="filter-note">
                Pick a specialty to unlock procedure-specific filters.
              </p>
            </section>

            <section v-if="showSpecialties" class="filter-section">
              <header>
                <h4>Specialized care</h4>
              </header>

              <div class="specialty-groups">
                <section
                  v-for="group in specialtyGroups"
                  :key="group.key"
                  class="specialty-group"
                >
                  <button
                    type="button"
                    class="specialty-group__toggle"
                    :aria-expanded="openCategory === group.key ? 'true' : 'false'"
                    @click="toggleCategory(group.key)"
                  >
                    {{ group.label }}
                  </button>

                  <ul v-if="openCategory === group.key" class="specialty-group__items">
                    <li v-for="item in group.items" :key="item.mapto">
                      <label class="radio-option">
                        <input
                          :checked="specialty === item.mapto"
                          name="specialty"
                          type="radio"
                          :value="item.mapto"
                          @change="store.setSpecialty(item.mapto)"
                        />
                        <span>{{ item.label }}</span>
                      </label>

                      <div
                        v-if="specialty === item.mapto && (item.hv || item.lm)"
                        class="specialty-group__nested"
                      >
                        <label v-if="item.hv" class="check-option">
                          <input
                            :checked="hvOn"
                            type="checkbox"
                            @change="store.setHVOn($event.target.checked)"
                          />
                          <span>High procedure volume</span>
                        </label>

                        <label v-if="item.lm" class="check-option">
                          <input
                            :checked="lmOn"
                            type="checkbox"
                            @change="store.setLMOn($event.target.checked)"
                          />
                          <span>High 6-month survival</span>
                        </label>
                      </div>
                    </li>
                  </ul>
                </section>
              </div>
            </section>

            <section class="filter-section">
              <header>
                <h4>Reliable excellence</h4>
              </header>

              <label class="toggle-option">
                <input
                  :checked="excellence"
                  type="checkbox"
                  @change="store.setExcellence($event.target.checked)"
                />
                <span>Show only hospitals with the Reliable Excellence Indicator.</span>
              </label>
            </section>
          </div>

          <footer class="filters-panel__footer">
            <button type="button" class="ghost" @click="store.clearFilters()">
              Clear filters
            </button>
            <button type="button" @click="filterOpen = false">
              Apply
            </button>
          </footer>
        </div>
      </aside>

      <div class="results-main">
        <section v-if="appliedFilters.length" class="applied-filters">
          <div class="applied-filters__header">
            <h3>Filters applied</h3>
            <button type="button" @click="store.clearFilters()">
              Clear all
            </button>
          </div>

          <div class="applied-filters__list">
            <template v-for="chip in appliedFilters" :key="chip.key">
              <span v-if="chip.locked" class="chip chip--locked">{{ chip.label }}</span>
              <button v-else type="button" class="chip" @click="removeFilter(chip.key)">
                {{ chip.label }}
              </button>
            </template>
          </div>
        </section>

        <section class="score-legend">
          <div>
            <p class="eyebrow">How to read the cards</p>
            <h3>Overall score combines experience, quality, and safety.</h3>
          </div>
          <div class="score-legend__scale" aria-hidden="true">
            <span>Lower</span>
            <strong />
            <span>Higher</span>
          </div>
        </section>

        <section v-if="error" class="results-error">
          {{ error }}
        </section>

        <section v-if="!loading && !locations.length" class="results-empty">
          <h3>No hospitals found</h3>
          <p>
            The location you entered may not meet the minimum population or size requirements.
            Try widening the radius or searching for a larger nearby city.
          </p>
        </section>

        <section v-else class="results-list">
          <LocationCard
            v-for="location in visibleLocations"
            :key="location.id"
            :location="location"
          />
        </section>

        <div v-if="remainingCount > 0" class="load-more">
          <button type="button" @click="shown += props.pageSize">
            Show the next {{ Math.min(props.pageSize, remainingCount) }} result<span v-if="Math.min(props.pageSize, remainingCount) !== 1">s</span>
          </button>
          <p>{{ resultStatus }}</p>
        </div>

        <div class="results-actions">
          <button type="button" class="back-to-top" @click="scrollToTop">
            Back to top
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.results-experience {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.results-experience__heading {
  display: grid;
  gap: 1rem;

  h2 {
    font-family: var(--font-literata);
    font-size: clamp(1.8rem, 3vw, 2.35rem);
    line-height: 1.06;
    margin-top: 0.35rem;
  }

  p:not(.eyebrow) {
    margin-top: 0.45rem;
    color: color-mix(in srgb, var(--color-text) 78%, white);
    line-height: 1.65;
  }
}

.results-experience__status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;

  span {
    color: color-mix(in srgb, var(--color-text) 74%, white);
    font-weight: 700;
  }
}

.eyebrow {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-blue--3);
}

.filter-toggle,
.filters-panel__footer button,
.applied-filters__header button,
.load-more button,
.back-to-top {
  min-height: 2.9rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--color-blue--1);
  background: white;
  color: var(--color-blue--1);
  font-weight: 800;
  transition:
    transform 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    color: var(--color-green--1);
    border-color: var(--color-green--1);
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(14, 16, 47, 0.08);
    outline: none;
  }
}

.results-experience__layout {
  display: grid;
  gap: 1.5rem;
}

.filters-shell {
  position: relative;
}

.filters-shell__scrim {
  position: fixed;
  inset: 0;
  z-index: 19;
  border: 0;
  background: rgba(6, 10, 28, 0.55);
  opacity: 0;
  pointer-events: none;
}

.filters-panel {
  display: grid;
  gap: 1.25rem;
  padding: 1.3rem;
  border-radius: 1.5rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 20px 40px rgba(14, 16, 47, 0.08);
}

.filters-panel__header,
.filters-panel__footer,
.applied-filters__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.filters-panel__header {
  h3 {
    font-size: 1.35rem;
    line-height: 1.1;
    margin-top: 0.25rem;
  }
}

.filters-panel__close {
  min-height: 2.2rem;
  padding: 0.3rem 0.75rem;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--color-text) 65%, white);
  font-weight: 800;
}

.filters-panel__body {
  display: grid;
  gap: 1rem;
}

.filter-section {
  display: grid;
  gap: 0.9rem;
  padding: 1.05rem;
  border-radius: 1.2rem;
  background: rgba(85, 98, 252, 0.04);
  border: 1px solid rgba(85, 98, 252, 0.08);

  header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: baseline;
  }

  h4 {
    font-size: 1rem;
    line-height: 1.2;
  }

  header span {
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--color-blue--3);
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--color-blue--1);
  }
}

.filter-section__scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: color-mix(in srgb, var(--color-text) 72%, white);
}

.filter-note {
  color: color-mix(in srgb, var(--color-text) 76%, white);
  line-height: 1.6;
}

.check-grid,
.specialty-group__nested {
  display: grid;
  gap: 0.75rem;
}

.check-option,
.toggle-option,
.radio-option {
  display: flex;
  gap: 0.75rem;
  align-items: start;
  line-height: 1.55;

  input {
    margin-top: 0.15rem;
    accent-color: var(--color-blue--1);
  }
}

.specialty-groups {
  display: grid;
  gap: 0.75rem;
}

.specialty-group {
  border-radius: 1rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
}

.specialty-group__toggle {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 0;
  background: transparent;
  text-align: left;
  font-weight: 800;
  color: var(--color-blue--4);
}

.specialty-group__items {
  display: grid;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  list-style: none;
}

.specialty-group__nested {
  padding-left: 1.85rem;
}

.filters-panel__footer {
  padding-top: 0.25rem;
}

.filters-panel__footer .ghost,
.applied-filters__header button {
  border-color: rgba(14, 16, 47, 0.12);
  color: color-mix(in srgb, var(--color-text) 75%, white);
}

.results-main {
  display: grid;
  gap: 1rem;
}

.applied-filters,
.score-legend,
.results-empty,
.results-error {
  padding: 1.2rem;
  border-radius: 1.4rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 18px 34px rgba(14, 16, 47, 0.05);
}

.applied-filters__header {
  margin-bottom: 0.85rem;

  h3 {
    font-size: 1rem;
  }
}

.applied-filters__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.chip {
  min-height: 2.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(14, 16, 47, 0.12);
  background: rgba(85, 98, 252, 0.06);
  color: var(--color-blue--3);
  font-weight: 800;
}

.chip--locked {
  background: rgba(0, 135, 90, 0.08);
  color: var(--color-green--1);
}

.score-legend {
  display: grid;
  gap: 1rem;

  h3 {
    font-size: 1.08rem;
    line-height: 1.35;
    margin-top: 0.25rem;
  }
}

.score-legend__scale {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;

  strong {
    height: 0.7rem;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(85, 98, 252, 0.22), var(--color-green--1));
  }

  span {
    font-size: 0.88rem;
    font-weight: 700;
    color: color-mix(in srgb, var(--color-text) 72%, white);
  }
}

.results-error {
  color: var(--color-red--1);
  font-weight: 700;
}

.results-empty {
  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.4rem;
  }

  p {
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-text) 78%, white);
  }
}

.results-list {
  display: grid;
  gap: 1rem;
}

.load-more,
.results-actions {
  display: grid;
  gap: 0.6rem;
  justify-items: center;

  p {
    color: color-mix(in srgb, var(--color-text) 72%, white);
    font-weight: 700;
  }
}

@media (max-width: 999px) {
  .filters-shell {
    position: static;
  }

  .filters-panel {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    max-height: 88vh;
    border-radius: 1.75rem 1.75rem 0 0;
    transform: translateY(102%);
    transition: transform 180ms ease;
  }

  .filters-panel__body {
    overflow: auto;
    padding-right: 0.2rem;
  }

  .filters-shell[data-open='true'] .filters-shell__scrim {
    opacity: 1;
    pointer-events: auto;
  }

  .filters-shell[data-open='true'] .filters-panel {
    transform: translateY(0);
  }
}

@media (min-width: 1000px) {
  .results-experience__heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .filter-toggle,
  .filters-panel__close {
    display: none;
  }

  .results-experience__layout {
    grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
    align-items: start;
  }

  .filters-panel {
    position: sticky;
    top: 1.5rem;
  }
}
</style>
