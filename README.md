# HealthLocator Astro Migration Preview

This repo is a small Netlify test export for the Astro + Vue migration preview.

## Structure

- `src/` contains the Astro app.
- `data/` and `public/` are shared source assets used by the Astro app.
- `app/styles/` contains the legacy design tokens and icon variables imported by the Astro global stylesheet.

## Netlify

Netlify should use the root `netlify.toml`:

```toml
[build]
command = "npm run build"
publish = "dist"
```

The Astro app is configured with the Netlify adapter for server-rendered routes and API endpoints.

## Local

Use Node `22.12.0` or newer.

```bash
npm install
npm run dev
```
