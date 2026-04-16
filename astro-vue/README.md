# Astro + Vue Migration App

This directory contains the first migration slice from the existing Next.js app to Astro + Vue.

## What is included

- Astro server app configured for Node deployment
- Vue components rendered inside Astro pages
- Pinia wired through Astro's Vue `appEntrypoint`
- Shared data loaded from the root `data/` directory
- Shared assets served from the root `public/` directory
- Home page and first-pass search route

## Run it

Use Node `v22.12.0` or newer.

```bash
cd /Users/kylesandstrom/Work/Dev/Mayo/cdp-public-healthlocator-v3/astro-vue
npm run dev
```

## Build it

```bash
cd /Users/kylesandstrom/Work/Dev/Mayo/cdp-public-healthlocator-v3/astro-vue
npm run build
```
