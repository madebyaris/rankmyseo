# rankmyseo

Interactive installer for [RankMySEO](https://github.com/madebyaris/rankmyseo) — pick **recommended**, **full**, or **custom** `@rankmyseo/*` packages instead of installing each one by hand.

## Quick start

```bash
npm i rankmyseo
npx rankmyseo install
```

Or run directly without adding to `package.json`:

```bash
npx rankmyseo install
```

## Presets

| Preset | Packages |
| --- | --- |
| **Recommended** | `@rankmyseo/core`, `@rankmyseo/storage`, `@rankmyseo/server-hono`, `@rankmyseo/react`, `@rankmyseo/cli` (+ peer deps `hono`, `react`) |
| **Full** | All 10 `@rankmyseo/*` packages |
| **Custom** | Pick from the numbered list |

## Non-interactive

```bash
npx rankmyseo install --yes --preset recommended
npx rankmyseo install --preset full
npx rankmyseo install --packages @rankmyseo/core,@rankmyseo/ui
```

## After install

```bash
npx rankmyseo init
npx rankmyseo migrate
```

## License

Apache-2.0
