import { type RankMySeoConfig, rankMySeoConfigSchema } from "./schema.js";

export function defineConfig(
  config: Parameters<typeof rankMySeoConfigSchema.parse>[0],
): RankMySeoConfig {
  return rankMySeoConfigSchema.parse(config);
}
