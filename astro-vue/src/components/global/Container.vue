<script setup>
const props = defineProps({
  size: {
    type: String,
    default: '',
  },
  inset: {
    type: Boolean,
    default: false,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="container"
    :data-size="props.size || null"
    :data-inset="props.inset || null"
    :data-no-padding="props.noPadding || null"
  >
    <slot />
  </div>
</template>

<style scoped lang="scss">
.container {
  --max-width: 1328px;

  width: min(calc(100% - 2rem), var(--max-width));
  margin: 0 auto;

  &[data-size='xg'] {
    --max-width: 1496px;
  }

  &[data-size='m'] {
    --max-width: 1032px;
  }

  &[data-size='ch'] {
    --max-width: 888px;
  }

  &[data-inset='true'] {
    width: min(calc(100% - 1rem), var(--max-width));
  }

  &[data-no-padding='true'] {
    width: min(100%, var(--max-width));
  }
}
</style>
