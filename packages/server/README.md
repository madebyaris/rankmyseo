# @rankmyseo/server

Framework-agnostic HTTP handler for [RankMySEO](https://github.com/madebyaris/rankmyseo), built on Web-standard `Request`/`Response`. Exposes the full dashboard API plus site features (live scan, meta generator, blog, sitemap, `llms.txt`, markdown negotiation). Server-only.

## Install

```bash
npm i @rankmyseo/server @rankmyseo/core @rankmyseo/storage
```

Prefer a framework adapter where available (e.g. [`@rankmyseo/server-hono`](https://www.npmjs.com/package/@rankmyseo/server-hono)).

## Usage

```ts
import { createHandler } from "@rankmyseo/server";
import { createStore } from "@rankmyseo/storage";

const store = createStore("sqlite:///path/to/db.sqlite");
const handler = createHandler(store /*, { config, agentModel } */);

// handler(request: Request): Promise<Response>
```

All routes are scoped by `x-tenant-id` and `x-project-id` headers.

## Documentation

See the [Wiki → API Reference](https://github.com/madebyaris/rankmyseo/wiki/API-Reference).

## License

Apache-2.0
