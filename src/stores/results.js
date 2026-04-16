import { defineStore } from 'pinia';

const DEFAULT_RADIUS = 25;

function numberOrNull(value) {
  if (value === '' || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const useResultsStore = defineStore('results', {
  state: () => ({
    by: 'city',
    routeVariant: 'search',
    locations: [],
    hospital: '',
    state: '',
    city: '',
    zip: '',
    specialty: '',
    excellence: false,
    radius: DEFAULT_RADIUS,
    lat: null,
    lng: null,
    hvOn: false,
    lmOn: false,
    loading: false,
    error: '',
    hasSearched: false,
    hydrated: false,
    requestId: 0,
  }),
  getters: {
    isStateRoute: (state) => state.routeVariant === 'state',
    isSpecialtyPageRoute: (state) => state.routeVariant === 'specialty',
    isCareSearchRoute: (state) => state.routeVariant === 'care-search',
    isSpecialtyLocked() {
      return this.isSpecialtyPageRoute || this.isCareSearchRoute;
    },
  },
  actions: {
    hydrate(payload = {}) {
      this.by = payload.by || 'city';
      this.routeVariant = payload.routeVariant || 'search';
      this.locations = Array.isArray(payload.initialLocations) ? payload.initialLocations : [];
      this.hospital = payload.hospital || '';
      this.state = payload.state || '';
      this.city = payload.city || '';
      this.zip = payload.zip || '';
      this.specialty = payload.specialty || '';
      this.excellence = Boolean(payload.excellence);
      this.radius = Number(payload.radius) > 0 ? Number(payload.radius) : DEFAULT_RADIUS;
      this.lat = numberOrNull(payload.lat);
      this.lng = numberOrNull(payload.lng);
      this.hvOn = Boolean(payload.hvOn);
      this.lmOn = Boolean(payload.lmOn);
      this.loading = false;
      this.error = '';
      this.hasSearched = true;
      this.hydrated = true;
    },
    buildLocationsQuery() {
      const params = new URLSearchParams();

      params.set('by', this.by || 'city');
      params.set('excellence', this.excellence ? '1' : '0');

      if (this.specialty) {
        params.set('specialty', this.specialty);
        params.set(`v_${this.specialty}`, '1');

        if (this.hvOn) {
          params.set(`hv_${this.specialty}`, '1');
        }

        if (this.lmOn) {
          params.set(`lm_${this.specialty}`, '1');
        }
      }

      if (this.hospital) {
        params.set('hospital', this.hospital);
      }

      if (this.lat != null && this.lng != null) {
        params.set('lat', String(this.lat));
        params.set('lng', String(this.lng));
        params.set('radius', String(this.radius || DEFAULT_RADIUS));
        return params.toString();
      }

      if (this.zip) {
        params.set('zip', this.zip);
        params.set('radius', String(this.radius || DEFAULT_RADIUS));
        return params.toString();
      }

      if (this.city) {
        params.set('city', this.city);

        if (this.state) {
          params.set('state', this.state);
        }

        if (!this.isStateRoute && !this.isSpecialtyPageRoute) {
          params.set('radius', String(this.radius || DEFAULT_RADIUS));
        }

        return params.toString();
      }

      if (this.state) {
        params.set('state', this.state);
      }

      return params.toString();
    },
    async fetchLocations() {
      const currentRequest = ++this.requestId;
      this.loading = true;
      this.error = '';

      try {
        const response = await fetch(`/api/locations?${this.buildLocationsQuery()}`, {
          cache: 'no-store',
        });
        const rows = response.ok ? await response.json() : [];

        if (currentRequest !== this.requestId) {
          return;
        }

        this.locations = Array.isArray(rows) ? rows : [];
        this.hasSearched = true;
      } catch {
        if (currentRequest !== this.requestId) {
          return;
        }

        this.locations = [];
        this.error = 'We could not refresh the results right now. Please try again.';
        this.hasSearched = true;
      } finally {
        if (currentRequest === this.requestId) {
          this.loading = false;
        }
      }
    },
    async setRadius(value) {
      this.radius = Number(value) > 0 ? Number(value) : DEFAULT_RADIUS;
      await this.fetchLocations();
    },
    async setExcellence(value) {
      this.excellence = Boolean(value);
      await this.fetchLocations();
    },
    async setSpecialty(value) {
      this.specialty = value || '';
      this.hvOn = false;
      this.lmOn = false;
      await this.fetchLocations();
    },
    async setHVOn(value) {
      this.hvOn = Boolean(value);
      await this.fetchLocations();
    },
    async setLMOn(value) {
      this.lmOn = Boolean(value);
      await this.fetchLocations();
    },
    async clearFilters() {
      this.excellence = false;
      this.hvOn = false;
      this.lmOn = false;
      this.radius = DEFAULT_RADIUS;

      if (!this.isSpecialtyLocked) {
        this.specialty = '';
      }

      await this.fetchLocations();
    },
  },
});
