# @rankmyseo/ui

Prebuilt dashboard widgets and the config-driven `DashboardRenderer` for [RankMySEO](https://github.com/madebyaris/rankmyseo). Widgets consume the `@rankmyseo/react` hooks. Ships its own `.rms-*` CSS — **no Tailwind/shadcn install required in your app.**

## Install

```bash
npm i @rankmyseo/ui @rankmyseo/react react react-dom
```

`react` and `react-dom` are peer dependencies.

## Usage

```tsx
import { DashboardRenderer } from "@rankmyseo/ui";
import "@rankmyseo/ui/styles.css";

<DashboardRenderer widgets={dashboardConfig.widgets} />;
```

Widgets: `RankHistoryChart`, `KeywordTable`, `AuditScoreCard`, `TopMoversList`, `CoreWebVitalsGauge`, `BlogManager`, … Customize via CSS variables on `.rms-root` (`--rms-primary`, `--rms-radius`, …).

## Documentation

See the [Wiki → Dashboard and Widgets](https://github.com/madebyaris/rankmyseo/wiki/Dashboard-and-Widgets).

## License

Apache-2.0
