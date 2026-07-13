# @rankmyseo/installer

## 1.0.0

### Minor Changes

- edffa29: Add framework-neutral `@rankmyseo/client` and `@rankmyseo/collector` packages; rewire `@rankmyseo/react` to use them while preserving public hook exports and the legacy `.api()` client surface.
- f4a51d8: Add Express, Next.js App Router, and Nitro/h3 server adapters plus installer catalog entries and SvelteKit/Astro Request/Response fixture examples.

### Patch Changes

- 63b1bad: Document the final M5 ecosystem support matrix (adapters, storage options, client/collector, regression CLI) and polish the installer catalog CLI description. Astro docs app at `apps/docs` dogfoods `@rankmyseo/client`.
- c801bcf: Add Postgres (Drizzle) to `@rankmyseo/storage`, plus optional `@rankmyseo/storage-prisma` and `@rankmyseo/storage-kysely` RankStore adapters with contract tests against real Postgres. MySQL remains unsupported with a clear factory error.
- 649a9bd: Add headless `@rankmyseo/vue` (Vue 3 composables + plugin) and `@rankmyseo/svelte` (Svelte 4/5 stores + context) client packages with parity to React hooks, backed by `@rankmyseo/client` and `@rankmyseo/collector`.

## 0.3.0

### Minor Changes

- Add interactive npm installer: `npm i rankmyseo` + `npx rankmyseo install` with recommended, full, or custom @rankmyseo/\* package presets.
