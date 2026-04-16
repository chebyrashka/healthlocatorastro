import { defineStore } from 'pinia';

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchType: 'city',
    keyword: '',
    specialty: '',
    error: '',
  }),
  actions: {
    hydrate(payload = {}) {
      this.searchType = payload.searchType || 'city';
      this.keyword = payload.keyword || '';
      this.specialty = payload.specialty || '';
      this.error = '';
    },
    setSearchType(type) {
      this.searchType = type;
      this.error = '';

      if (type !== 'care') {
        this.specialty = '';
      }

      if (type === 'hospital') {
        this.keyword = '';
      }
    },
    setKeyword(value) {
      this.keyword = value;
      this.error = '';
    },
    setSpecialty(value) {
      this.specialty = value;
      this.error = '';
    },
    setError(message) {
      this.error = message;
    },
    clearError() {
      this.error = '';
    },
  },
});
