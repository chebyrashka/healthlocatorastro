<script setup>
import Container from './Container.vue';

const props = defineProps({
  location: {
    type: String,
    default: 'inner',
  },
});
</script>

<template>
  <header class="global-header" :data-location="props.location || null">
    <Container>
      <a
        aria-label="HealthLocator home"
        class="global-header__brand"
        href="/"
        data-dl='{"link_category":"logo","link_action":"navigate","link_label":"HealthLocator"}'
      >
        <span>HealthLocator</span>
      </a>
    </Container>
  </header>
</template>

<style scoped lang="scss">
.global-header {
  --logo-color: var(--color-green-1);

  padding: 1.5rem 0;
  background:
    radial-gradient(circle at top left, rgba(1, 170, 55, 0.12), transparent 28rem),
    color-mix(in srgb, var(--color-blue--4) 3%, white);
  border-bottom: 1px solid rgba(14, 16, 47, 0.08);
}

.global-header__brand {
  display: inline-flex;
  width: fit-content;
  padding: 0.5rem 0;

  span {
    display: block;
    width: clamp(176px, 22vw, 230px);
    height: 1.75rem;
    overflow: clip;
    text-indent: -999vw;
    background-color: var(--logo-color);
    mask-image: var(--logo-healthlocator);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
  }

  &:focus-visible {
    outline: none;
    background: var(--color-focus-background);
    box-shadow: 0 4px 0 0 var(--color-focus);

    span {
      background-color: var(--color-focus);
    }
  }
}

@media (min-width: 700px) {
  .global-header {
    padding: 1.25rem 0;
  }
}
</style>
