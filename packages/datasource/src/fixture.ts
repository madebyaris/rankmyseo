import "server-only";

import type {
  CreateRankSnapshotInput,
  PositionQuery,
  RankDataSource,
} from "@rankmyseo/core";

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export class FixtureDataSource implements RankDataSource {
  readonly id = "fixture";
  readonly capabilities = {
    ownedOnly: false,
    realtime: true,
    competitors: true,
  };

  async fetchPositions(query: PositionQuery): Promise<CreateRankSnapshotInput[]> {
    const capturedAt = new Date();
    return query.keywordIds.map((keywordId, index) => ({
      tenantId: query.tenantId,
      projectId: query.projectId,
      keywordId,
      position: (hashString(keywordId) % 20) + 1 + index,
      url: "https://example.com/page",
      source: this.id,
      device: query.device,
      country: query.country,
      capturedAt,
    }));
  }
}
