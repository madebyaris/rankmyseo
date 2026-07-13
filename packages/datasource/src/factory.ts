import "server-only";

import type { DataSourceConfig, RankDataSource } from "@rankmyseo/core";
import { FixtureDataSource } from "./fixture.js";
import { GscDataSource, type GscKeyword } from "./gsc.js";

export interface CreateDataSourceOptions {
  configs: DataSourceConfig[];
  siteUrl?: string;
  /** OAuth access token for GSC (maps from config.apiKey for backwards compatibility). */
  accessToken?: string;
  keywords?: GscKeyword[];
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
        accessToken: options.accessToken ?? config?.apiKey ?? "",
        siteUrl: options.siteUrl ?? "https://example.com",
        keywords: options.keywords,
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
