<script setup>
import { ref } from 'vue';

const props = defineProps({
  states: {
    type: Array,
    default: () => [],
  },
});

const expanded = ref(false);

function stateHref(abbreviation = '') {
  return `/search?state=${encodeURIComponent(abbreviation)}`;
}
</script>

<template>
  <section class="state-list">
    <button type="button" :aria-expanded="expanded ? 'true' : 'false'" @click="expanded = !expanded">
      View states in a table
    </button>

    <ul v-if="expanded">
      <li v-for="state in props.states" :key="state.abbreviation">
        <a :href="stateHref(state.abbreviation)">
          <figure :style="{ '--mask-image': `url('/img/states/${state.pathname}.svg')` }" />
          {{ state.name }}
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.state-list {
  margin-top: 1rem;
  padding-block: 2rem;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-image: repeating-linear-gradient(
      to right,
      var(--color-blue--1) 0 1px,
      transparent 1px 5px
    )
    1;
}

button {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  gap: 1rem;
  align-items: center;
  border: 0;
  background: transparent;
  color: var(--color-blue--1);
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.6;

  &::before,
  &::after {
    content: '';
    grid-row: 1;
    grid-column: 1;
    display: block;
    width: 1.5rem;
    aspect-ratio: 1;
    background: currentColor;
    mask: var(--icon-minus);
    transition: transform 160ms ease;
  }

  &::after {
    transform: rotate(90deg);
  }

  &[aria-expanded='true']::after {
    transform: rotate(0deg);
  }

  &:hover,
  &:focus-visible {
    color: var(--color-green--1);
    outline: none;
  }
}

ul {
  column-count: 2;
  column-gap: 1.5rem;
  margin: 2rem 0 0;
  padding: 0;
  list-style: none;
}

li {
  break-inside: avoid;
}

a {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 1rem 0.5rem;
  color: var(--color-action);
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.25;
  text-decoration: underline 1px;
  text-decoration-color: color-mix(in srgb, var(--color-action) 30%, transparent);
  text-underline-offset: 2px;
  transition:
    color 160ms ease,
    text-decoration-color 160ms ease;

  &:hover,
  &:focus-visible {
    color: var(--color-green--1);
    text-decoration-color: transparent;
    outline: none;

    figure {
      background-color: var(--color-green-1);
    }
  }

  &:focus-visible {
    color: var(--color-focus);
    background: var(--color-focus-background);
    box-shadow: 0 4px 0 0 var(--color-focus);

    figure {
      background-color: var(--color-focus);
    }
  }
}

figure {
  flex: 0 0 auto;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-green-2);
  mask-image: var(--mask-image);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  transition: background-color 160ms ease;
}

@media (min-width: 600px) {
  ul {
    column-count: 3;
  }
}

@media (min-width: 905px) {
  ul {
    column-count: 4;
  }
}

@media (min-width: 1185px) {
  ul {
    column-count: 5;
  }
}
</style>
