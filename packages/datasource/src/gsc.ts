import "server-only";

import type {
  CreateRankSnapshotInput,
  PositionQuery,
  RankDataSource,
} from "@rankmyseo/core";

export interface GscDataSourceOptions {
  apiKey: string;
  siteUrl: string;
  fetchImpl?: typeof fetch;
}

export class GscDataSource implements RankDataSource {
  readonly id = "gsc";
  readonly capabilities = {
    ownedOnly: true,
    realtime: false,
    competitors: false,
  };

  constructor(private readonly options: GscDataSourceOptions) {}

  async fetchPositions(query: PositionQuery): Promise<CreateRankSnapshotInput[]> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const capturedAt = new Date();

    const response = await fetchImpl(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.options.siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: capturedAt.toISOString().slice(0, 10),
          endDate: capturedAt.toISOString().slice(0, 10),
          dimensions: ["query"],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      rows?: Array<{ keys?: string[]; position?: number }>;
    };

    return query.keywordIds.map((keywordId) => {
      const row = data.rows?.find((r) => r.keys?.[0] === keywordId);
      return {
        tenantId: query.tenantId,
        projectId: query.projectId,
        keywordId,
        position: row?.position ? Math.round(row.position) : null,
        url: this.options.siteUrl,
        source: this.id,
        device: query.device,
        country: query.country,
        capturedAt,
      };
    });
  }
}
