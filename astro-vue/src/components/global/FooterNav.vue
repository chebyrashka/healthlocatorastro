<script setup>
import Container from './Container.vue';

const props = defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
});

const currentYear = new Date().getFullYear();

function formatText(value = '') {
  return value.replace('{{year}}', String(currentYear));
}

function targetFor(url = '') {
  return url.startsWith('http') ? '_blank' : '_self';
}
</script>

<template>
  <footer class="footer">
    <Container>
      <div class="footer__grid">
        <div class="branding">
          <p>HealthLocator</p>
        </div>

        <section
          v-for="(section, index) in props.sections"
          :key="index"
          :data-section="section.section || null"
        >
          <h2 v-if="section.title">{{ section.title }}</h2>

          <nav v-if="section.links?.length">
            <a
              v-for="link in section.links"
              :key="`${link.label}-${link.url}`"
              :href="link.url"
              :target="targetFor(link.url)"
              :rel="targetFor(link.url) === '_blank' ? 'noopener noreferrer' : undefined"
              :id="link.id || undefined"
            >
              {{ link.label }}
            </a>
          </nav>

          <p v-if="section.text" v-html="formatText(section.text)" />
        </section>
      </div>
    </Container>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  margin-top: 5rem;
  padding: 3rem 0;
  background: white;
  border-top: 1px solid rgba(14, 16, 47, 0.08);
}

.footer__grid {
  display: grid;
  gap: 1.5rem;
}

.branding p {
  width: 144px;
  height: 16px;
  overflow: clip;
  text-indent: -999vw;
  background: var(--color-blue--4);
  mask-image: var(--logo-healthlocator);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}

section {
  display: grid;
  gap: 0.5rem;

  h2 {
    font-size: 1rem;
    color: var(--color-text);
  }

  p {
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-text) 82%, white);
  }
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.25rem;
}

a {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--color-blue--4);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in srgb, var(--color-blue--4) 28%, transparent);
  text-underline-offset: 2px;

  &:hover,
  &:focus-visible {
    text-decoration-color: transparent;
    outline: none;
  }

  &[id='privacyManageCookies'] {
    display: none;
  }
}

@media (min-width: 720px) {
  .footer__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .branding {
    grid-column: 1 / -1;
  }
}
</style>
