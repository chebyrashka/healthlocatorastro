<script setup>
defineProps({
  heading: {
    type: String,
    required: true,
  },
  subheading: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <section class="hero">
    <div class="branding">
      <a href="/" aria-label="HealthLocator home">
        <span>Health Locator</span>
      </a>
    </div>

    <picture>
      <source :srcset="`/photos/${photo}-desktop.jpg`" media="(min-width: 700px)" />
      <img :src="`/photos/${photo}-mobile.jpg`" alt="" loading="eager" />
    </picture>

    <header>
      <p class="eyebrow">Powered by independent hospital quality data</p>
      <h1>{{ heading }}</h1>
      <p>{{ subheading }}</p>
    </header>
  </section>
</template>

<style scoped lang="scss">
.hero {
  --logo-color: var(--color-green--1);

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: min(46rem, 92vh);

  .branding {
    position: absolute;
    top: 2rem;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);

    a {
      display: block;
      width: clamp(176px, 22vw, 230px);
      padding: 0.5rem 0;
    }

    span {
      display: block;
      height: 28px;
      overflow: clip;
      text-indent: -999vw;
      background-color: var(--logo-color);
      mask-image: url('/logos/logo-healthlocator.svg');
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
    }
  }

  picture {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(14, 16, 47, 0.08) 20%, rgba(14, 16, 47, 0.8) 78%),
        linear-gradient(135deg, rgba(1, 170, 55, 0.16), transparent 55%);
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  header {
    position: relative;
    z-index: 1;
    width: min(100% - 2rem, 860px);
    margin: 0 auto;
    padding: 8rem 0 8rem;
    text-align: center;
    color: var(--color-text-invert);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.55rem 0.9rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(14px);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(2.8rem, 7vw, 5.25rem);
    line-height: 0.92;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }

  p:last-child {
    max-width: 40rem;
    margin: 0 auto;
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    line-height: 1.7;
    font-weight: 600;
  }
}
</style>
