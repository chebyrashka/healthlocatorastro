<script setup>
import Container from './Container.vue';

defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="announcement">
    <Container>
      <p>{{ message }}</p>
    </Container>
  </div>
</template>

<style scoped lang="scss">
.announcement {
  background: var(--color-blue--1);
  color: var(--color-white);
  padding: 0.65rem 0;

  p {
    text-align: center;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
}
</style>
