<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  photo: {
    type: String,
    default: '',
  },
  video: {
    type: String,
    default: '',
  },
  colorOverlay: {
    type: String,
    default: 'transparent',
  },
  href: {
    type: String,
    default: '#',
  },
  linkLabel: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <article class="card">
    <div v-if="video" class="media media--video" :style="{ '--overlay': colorOverlay }">
      <video autoplay muted loop playsinline>
        <source :src="video" type="video/mp4" />
      </video>
    </div>

    <picture v-else class="media">
      <img :src="photo" alt="" loading="lazy" />
    </picture>

    <div class="content">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <p v-if="note" class="note">
        <em>{{ note }}</em>
      </p>
      <a :href="href">
        <span>{{ linkLabel }}</span>
      </a>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 2rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 24px 48px rgba(14, 16, 47, 0.08);
}

.media {
  aspect-ratio: 498 / 448;
  overflow: hidden;
  background: #eef3ff;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.media--video {
  position: relative;
  background: var(--overlay);

  video {
    mix-blend-mode: screen;
  }
}

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem 2.25rem;
  text-align: center;

  h2 {
    font-size: 1.5rem;
    line-height: 1.15;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.75;
    color: color-mix(in srgb, var(--color-text) 82%, white);
  }

  .note {
    margin-top: 0.2rem;
    color: var(--color-green--1);
    font-size: 0.95rem;
    font-weight: 700;
  }

  a {
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3.25rem;
    padding: 0.7rem 1.35rem;
    border-radius: 999px;
    background: var(--color-blue--1);
    color: var(--color-text-invert);
    font-weight: 700;
    transition:
      background-color 160ms ease,
      transform 160ms ease;

    &:hover,
    &:focus-visible {
      background: var(--color-green--1);
      transform: translateY(-1px);
      outline: none;
    }
  }
}
</style>
