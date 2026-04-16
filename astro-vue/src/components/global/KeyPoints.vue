<script setup>
const props = defineProps({
  content: {
    type: Object,
    default: () => ({
      title: '',
      sections: [],
    }),
  },
});
</script>

<template>
  <section class="key-points">
    <header>
      <h2>{{ props.content.title }}</h2>
    </header>

    <ul>
      <li
        v-for="section in props.content.sections"
        :key="section.title"
        :style="{ '--mask-image': `var(--icon-${section.icon})` }"
      >
        <h3>{{ section.title }}</h3>
        <p>{{ section.text }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.key-points {
  padding: 2.5rem 0 1.5rem;

  header {
    max-width: 42rem;
    margin: 0 auto 1.5rem;
    text-align: center;
  }

  h2 {
    color: var(--color-text);
    font-size: clamp(1.45rem, 3vw, 2rem);
    font-weight: 800;
    line-height: 1.15;
  }

  ul {
    display: grid;
    gap: 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 1.4rem;
    border-radius: 1.5rem;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.78)),
      rgba(85, 98, 252, 0.06);
    border: 1px solid rgba(14, 16, 47, 0.08);
    text-align: center;
    box-shadow: 0 18px 34px rgba(14, 16, 47, 0.05);

    &::before {
      content: '';
      display: block;
      width: 2rem;
      height: 2rem;
      margin: 0 auto 0.8rem;
      background: var(--color-green-1);
      mask-image: var(--mask-image);
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
    }
  }

  h3 {
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 0.45rem;
  }

  p {
    color: color-mix(in srgb, var(--color-text) 82%, white);
    font-size: 1rem;
    line-height: 1.65;
  }
}

@media (min-width: 700px) {
  .key-points {
    ul {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}
</style>
