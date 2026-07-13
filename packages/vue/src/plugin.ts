import type { App, InjectionKey, Plugin } from "vue";
import {
  createRankMySeoClient,
  type RankMySeoClient,
  type RankMySeoClientConfig,
} from "@rankmyseo/client";
import { inject } from "vue";

export type { RankMySeoClient, RankMySeoClientConfig };

export const RANKMYSEO_CLIENT_KEY: InjectionKey<RankMySeoClient> =
  Symbol("rankmyseo-client");

/**
 * Vue plugin factory — `app.use(createRankMySeoPlugin(config))`.
 */
export function createRankMySeoPlugin(
  config: RankMySeoClientConfig,
): Plugin {
  const client = createRankMySeoClient(config);
  return {
    install(app: App) {
      app.provide(RANKMYSEO_CLIENT_KEY, client);
    },
  };
}

/**
 * Vue plugin that accepts config as `app.use(RankMySeoPlugin, config)`.
 */
export const RankMySeoPlugin: Plugin<[RankMySeoClientConfig]> = {
  install(app: App, config: RankMySeoClientConfig) {
    if (!config?.baseUrl || !config.tenantId || !config.projectId) {
      throw new Error(
        "RankMySeoPlugin requires { baseUrl, tenantId, projectId }",
      );
    }
    const client = createRankMySeoClient(config);
    app.provide(RANKMYSEO_CLIENT_KEY, client);
  },
};

export function useRankMySeoClient(): RankMySeoClient {
  const client = inject(RANKMYSEO_CLIENT_KEY, null);
  if (!client) {
    throw new Error(
      "useRankMySeoClient() must be used after installing RankMySeoPlugin / createRankMySeoPlugin",
    );
  }
  return client;
}

export { createRankMySeoClient };
