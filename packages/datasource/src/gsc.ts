import type {
  CreateRankSnapshotInput,
  PositionQuery,
  RankDataSource,
} from "@rankmyseo/core";

export interface GscKeyword {
  id: string;
  text: string;
}

export interface GscDataSourceOptions {
  /** OAuth 2.0 access token for the Search Console API (not an API key). */
  accessToken: string;
  siteUrl: string;
  /** Optional map of keywordId → query text. Prefer passing keywords in fetchPositions. */
  keywords?: GscKeyword[];
  /** Inclusive lookback days for settled Search Console data (default 3–28 window). */
  lookbackDays?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Google Search Console Search Analytics datasource.
 * Positions are average position for the query over the requested window —
 * not a live SERP rank check.
 */
export class GscDataSource implements RankDataSource {
  readonly id = "gsc";
  readonly capabilities = {
    ownedOnly: true,
    realtime: false,
    competitors: false,
  };

  constructor(private readonly options: GscDataSourceOptions) {}

  async fetchPositions(
    query: PositionQuery & { keywords?: GscKeyword[] },
  ): Promise<CreateRankSnapshotInput[]> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const lookbackDays = this.options.lookbackDays ?? 28;
    // Search Console data typically settles ~2–3 days behind "today".
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (lookbackDays - 1));

    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const capturedAt = new Date(`${endDate}T12:00:00.000Z`);

    const response = await fetchImpl(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.options.siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 25_000,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      rows?: Array<{ keys?: string[]; position?: number }>;
    };

    const keywordList = (
      query.keywords ??
      this.options.keywords ??
      query.keywordIds.map((id) => ({ id, text: id }))
    ).filter((keyword) => query.keywordIds.includes(keyword.id));

    const byQuery = new Map<string, number>();
    for (const row of data.rows ?? []) {
      const text = row.keys?.[0]?.toLowerCase();
      if (text && typeof row.position === "number") {
        byQuery.set(text, row.position);
      }
    }

    return keywordList.map((keyword) => {
      const position = byQuery.get(keyword.text.toLowerCase());
      return {
        tenantId: query.tenantId,
        projectId: query.projectId,
        keywordId: keyword.id,
        position: position !== undefined ? Math.round(position) : null,
        url: this.options.siteUrl,
        source: this.id,
        device: query.device,
        country: query.country,
        capturedAt,
        serpFeatures: {
          metric: "search_console_average_position",
          window: { startDate, endDate },
        },
      };
    });
  }
}
