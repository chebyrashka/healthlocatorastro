<script setup>
const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  specialties: {
    type: Array,
    default: () => [],
  },
});

const sortedCategories = [...props.categories].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
);

function specialtyItems(categoryId) {
  return props.specialties
    .filter((item) => item.category === categoryId)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function splitLastWord(label = '') {
  const parts = label.trim().split(/\s+/);
  const last = parts.pop() || '';

  return {
    first: parts.join(' '),
    last,
  };
}

function specialtyHref(mapto = '') {
  return `/search?by=care&specialty=${encodeURIComponent(mapto)}`;
}
</script>

<template>
  <section class="specialty-list">
    <header class="specialty-list__header">
      <h2>View hospitals by specialized care</h2>
      <p>Care options are being added to HealthLocator all the time. Check back often.</p>
    </header>

    <div class="specialty-list__columns">
      <section
        v-for="category in sortedCategories"
        :key="category.id"
        class="specialty-category"
      >
        <template v-if="specialtyItems(category.id).length">
          <header>
            <figure>
              <img :src="`/icons/icon-${category.id}.svg`" :alt="`Icon of ${category.label}`" loading="lazy" />
            </figure>
            <h3>{{ category.label }}</h3>
          </header>

          <ul>
            <li v-for="item in specialtyItems(category.id)" :key="item.mapto">
              <em v-if="item.isNew">New</em>
              <a :href="specialtyHref(item.mapto)">
                <template v-if="splitLastWord(item.label).first">
                  {{ splitLastWord(item.label).first }}
                </template>
                <span>{{ splitLastWord(item.label).last }}</span>
              </a>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped lang="scss">
.specialty-list {
  width: 100%;
  padding: 3rem 0;
  border-top: 1px solid transparent;
  border-image: repeating-linear-gradient(
      to right,
      var(--color-blue--1) 0 1px,
      transparent 1px 5px
    )
    1;
}

.specialty-list__header {
  max-width: 48rem;
  margin: 0 auto 1.25rem;
  text-align: center;

  h2 {
    font-size: clamp(1.8rem, 3vw, 2rem);
    font-weight: 800;
    line-height: 1.125;
    margin-bottom: 0.75rem;
  }

  p {
    color: color-mix(in srgb, var(--color-text) 80%, white);
    font-size: 1.12rem;
    font-weight: 300;
    line-height: 1.66;
  }
}

.specialty-list__columns {
  column-count: 1;
}

.specialty-category {
  break-inside: avoid;
  display: flex;
  flex-direction: column;
  padding-block: 1.5rem;

  &:empty {
    display: none;
  }

  header {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  figure {
    display: block;
    width: 1.75rem;
    aspect-ratio: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  h3 {
    font-size: 1.35rem;
    font-weight: 800;
  }

  ul {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid transparent;
    border-image: repeating-linear-gradient(
        to right,
        var(--color-blue--1) 0 1px,
        transparent 1px 5px
      )
      1;
  }

  em {
    color: white;
    background: var(--color-green--1);
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-style: normal;
    font-weight: 800;
  }

  a {
    color: var(--color-action);
    font-size: 1.12rem;
    line-height: 1.55;
    text-align: left;
    transition:
      color 160ms ease,
      text-decoration-color 160ms ease;

    span {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;

      &::after {
        content: '';
        display: inline-block;
        width: 1rem;
        height: 1rem;
        background: var(--color-action);
        mask-image: url('/icons/icon-chevron.svg');
        mask-repeat: no-repeat;
        mask-position: center;
        mask-size: contain;
        transform: rotate(-90deg);
        transition: background-color 160ms ease;
      }
    }

    &:hover,
    &:focus-visible {
      color: var(--color-green--1);
      text-decoration-color: transparent;
      outline: none;

      span::after {
        background: var(--color-green--1);
      }
    }

    &:focus-visible {
      color: var(--color-focus);
      background: var(--color-focus-background);
      box-shadow: 0 4px 0 0 var(--color-focus);

      span::after {
        background: var(--color-focus);
      }
    }
  }
}

@media (min-width: 700px) {
  .specialty-list {
    padding: 4rem 0;
  }

  .specialty-list__columns {
    column-count: 2;
    column-gap: 4rem;
  }
}

@media (min-width: 1000px) {
  .specialty-list__columns {
    column-count: 3;
  }
}
</style>
