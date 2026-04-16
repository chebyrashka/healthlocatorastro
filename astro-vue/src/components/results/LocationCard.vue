<script setup>
import { computed } from 'vue';

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
});

const overallScore = computed(() => Math.round(Number(props.location?.s_mcvi || 0)));

const scoreRingStyle = computed(() => {
  const score = Math.max(0, Math.min(100, overallScore.value || 0));

  return {
    background: `radial-gradient(circle at center, white 54%, transparent 55%), conic-gradient(var(--color-green--1) ${score}%, rgba(14, 16, 47, 0.1) 0)`,
  };
});

const subscores = computed(() => [
  {
    key: 'experience',
    label: 'Experience',
    value: Math.round(Number(props.location?.s_hcahps || 0)),
  },
  {
    key: 'quality',
    label: 'Quality',
    value: Math.round(Number(props.location?.s_cms || 0)),
  },
  {
    key: 'safety',
    label: 'Safety',
    value: Math.round(Number(props.location?.s_safety || 0)),
  },
  {
    key: 'average',
    label: 'Average',
    value: Math.round(Number(props.location?.s_mcvi_avg || 0)),
  },
]);

const rankLabel = computed(() => {
  if (overallScore.value >= 90) {
    return 'Top tier';
  }

  if (overallScore.value >= 75) {
    return 'Strong match';
  }

  if (overallScore.value >= 60) {
    return 'Worth reviewing';
  }

  return 'Limited data';
});

const distanceLabel = computed(() => {
  const distance = Number(props.location?.distance);

  if (!Number.isFinite(distance)) {
    return '';
  }

  return `${distance.toFixed(distance < 10 ? 1 : 0)} miles away`;
});

const detailLabel = computed(() =>
  overallScore.value > 0 ? 'View score details' : 'See available data',
);
</script>

<template>
  <article class="location-card">
    <header class="location-card__header">
      <div class="location-card__copy">
        <div class="location-card__eyebrow">
          <span>{{ location.city }}, {{ location.state }}</span>
          <span v-if="distanceLabel">{{ distanceLabel }}</span>
        </div>

        <h3>
          <a :href="`/location/${location.id}`">
            {{ location.title }}
          </a>
        </h3>

        <p>
          {{ location.address }}<br />
          {{ location.city }}, {{ location.state }} {{ location.zip }}
        </p>
      </div>

      <div class="location-card__score">
      <div class="location-card__score-ring" :style="scoreRingStyle">
        <strong>{{ overallScore || '--' }}</strong>
        <span>overall</span>
      </div>
        <small>{{ rankLabel }}</small>
      </div>
    </header>

    <dl class="location-card__metrics">
      <div
        v-for="item in subscores"
        :key="item.key"
        class="location-card__metric"
      >
        <dt>{{ item.label }}</dt>
        <dd>
          <strong>{{ item.value || '--' }}</strong>
          <span class="meter">
            <span class="meter__fill" :style="{ width: `${Math.max(item.value, 0)}%` }" />
          </span>
        </dd>
      </div>
    </dl>

    <div class="location-card__footer">
      <span v-if="Number(location.excellence) === 1" class="location-card__badge">
        Reliable excellence
      </span>

      <a class="location-card__action" :href="`/location/${location.id}`">
        {{ detailLabel }}
      </a>
    </div>
  </article>
</template>

<style scoped lang="scss">
.location-card {
  display: grid;
  gap: 1.5rem;
  padding: 1.4rem;
  border-radius: 1.5rem;
  background: white;
  border: 1px solid rgba(14, 16, 47, 0.08);
  box-shadow: 0 18px 34px rgba(14, 16, 47, 0.06);
}

.location-card__header {
  display: grid;
  gap: 1.1rem;
}

.location-card__copy {
  display: grid;
  gap: 0.7rem;

  h3 {
    font-family: var(--font-literata);
    font-size: clamp(1.2rem, 2vw, 1.45rem);
    line-height: 1.2;
  }

  a {
    color: var(--color-blue--1);
    text-decoration: underline 1px;
    text-underline-offset: 0.18em;
    text-decoration-color: rgba(85, 98, 252, 0.28);
    transition:
      color 160ms ease,
      text-decoration-color 160ms ease;

    &:hover,
    &:focus-visible {
      color: var(--color-green--1);
      text-decoration-color: transparent;
      outline: none;
    }
  }

  p {
    line-height: 1.65;
    color: color-mix(in srgb, var(--color-text) 80%, white);
  }
}

.location-card__eyebrow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-blue--3);

  span + span::before {
    content: '';
    display: inline-block;
    width: 0.32rem;
    height: 0.32rem;
    margin: 0 0.75rem 0 0.1rem;
    border-radius: 999px;
    background: rgba(85, 98, 252, 0.25);
    vertical-align: middle;
  }
}

.location-card__score {
  display: inline-grid;
  gap: 0.55rem;
  justify-items: start;

  small {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--color-green--1);
  }
}

.location-card__score-ring {
  width: 6.5rem;
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 0.55rem;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid rgba(14, 16, 47, 0.08);

  strong {
    display: block;
    font-size: 1.55rem;
    line-height: 1;
    color: var(--color-blue--4);
  }

  span {
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: color-mix(in srgb, var(--color-text) 72%, white);
  }
}

.location-card__metrics {
  display: grid;
  gap: 0.85rem;
}

.location-card__metric {
  display: grid;
  gap: 0.35rem;

  dt {
    font-size: 0.9rem;
    font-weight: 700;
    color: color-mix(in srgb, var(--color-text) 75%, white);
  }

  dd {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: center;
  }

  strong {
    min-width: 2.2rem;
    font-size: 0.98rem;
    color: var(--color-blue--4);
  }
}

.meter {
  overflow: hidden;
  height: 0.6rem;
  border-radius: 999px;
  background: rgba(14, 16, 47, 0.08);
}

.meter__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-blue--1), var(--color-green--1));
}

.location-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  align-items: center;
  justify-content: space-between;
}

.location-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(0, 135, 90, 0.1);
  color: var(--color-green--1);
  font-size: 0.88rem;
  font-weight: 800;
}

.location-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.7rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--color-blue--1);
  color: var(--color-blue--1);
  font-weight: 800;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    color: var(--color-green--1);
    border-color: var(--color-green--1);
    transform: translateY(-1px);
    outline: none;
  }
}

@media (min-width: 720px) {
  .location-card__header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .location-card__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.25rem;
  }
}
</style>
