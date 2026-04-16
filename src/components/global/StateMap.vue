<script setup>
const props = defineProps({
  states: {
    type: Array,
    default: () => [],
  },
});

function stateHref(abbreviation = '') {
  return `/search?state=${encodeURIComponent(abbreviation)}`;
}
</script>

<template>
  <section class="state-map">
    <div class="state-map__grid">
      <header>
        <h2>View hospitals by state</h2>
        <p>Select a state on the map</p>
      </header>

      <ul>
        <li
          v-for="state in props.states"
          :key="state.abbreviation"
          :style="{ gridRow: state.row, gridColumn: state.col }"
        >
          <a :href="stateHref(state.abbreviation)" :aria-label="`View hospitals in ${state.name}`">
            {{ state.abbreviation }}
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.state-map {
  padding: 2rem 1.5rem;
  background:
    radial-gradient(circle at 25% 15%, rgba(255, 255, 255, 0.85), transparent 13rem),
    var(--color-blue-3);
  transition: border-radius 160ms ease;
}

.state-map__grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 0.25rem;
  width: 100%;
  max-width: 348px;
  margin: 0 auto;
}

header {
  grid-row: 1;
  grid-column: 1 / -1;
  text-align: center;

  h2 {
    font-size: clamp(1.75rem, 3.2vw, 2rem);
    font-weight: 800;
    line-height: 1.2;
  }

  p {
    color: color-mix(in srgb, var(--color-text) 80%, white);
    font-size: 1.12rem;
    font-weight: 300;
    line-height: 1.66;
  }
}

ul {
  grid-row: 2;
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  color: var(--color-text-invert);
  background: var(--color-green--1);
  font-size: 0.75rem;
  line-height: 1;
  font-weight: 800;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    background: var(--color-blue--1);
    transform: translateY(-1px);
    outline: none;
  }

  &:focus-visible {
    background: var(--color-focus-background);
    color: var(--color-focus);
    box-shadow: inset 0 0 0 4px var(--color-focus);
  }
}

@media (min-width: 700px) {
  .state-map {
    width: 100%;
    padding: 3rem;
  }

  .state-map__grid {
    max-width: 608px;
    gap: 0.5rem;
  }

  header {
    grid-row: 1;
    grid-column: 2 / span 9;
  }

  ul {
    grid-row: 1;
    gap: 0.5rem;
  }

  a {
    width: 3rem;
    height: 3rem;
  }
}

@media (min-width: 1496px) {
  .state-map {
    border-radius: 2rem;
  }
}
</style>
