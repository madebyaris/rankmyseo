import "server-only";

import type { DataSourceConfig, RankDataSource } from "@rankmyseo/core";
import { FixtureDataSource } from "./fixture.js";
import { GscDataSource } from "./gsc.js";

export interface CreateDataSourceOptions {
  configs: DataSourceConfig[];
  siteUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createDataSource(
  provider: DataSourceConfig["provider"],
  options: CreateDataSourceOptions,
): RankDataSource {
  const config = options.configs.find((c) => c.provider === provider);

  switch (provider) {
    case "fixture":
      return new FixtureDataSource();
    case "gsc":
      return new GscDataSource({
        apiKey: config?.apiKey ?? "",
        siteUrl: options.siteUrl ?? "https://example.com",
        fetchImpl: options.fetchImpl,
      });
    default:
      return new FixtureDataSource();
  }
}

export function createDefaultDataSource(
  options: CreateDataSourceOptions,
): RankDataSource {
  const defaultConfig =
    options.configs.find((c) => c.default) ?? options.configs[0];
  return createDataSource(defaultConfig?.provider ?? "fixture", options);
}
