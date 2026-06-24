import type {
  Audit,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  DashboardConfig,
  Keyword,
  Project,
  RankSnapshot,
  Report,
  SnapshotRangeQuery,
  TenantScope,
} from "../schemas/index.js";

export interface ProjectRepo {
  create(project: Omit<Project, "createdAt" | "updatedAt">): Promise<Project>;
  getById(scope: TenantScope, id: string): Promise<Project | undefined>;
  list(scope: TenantScope): Promise<Project[]>;
}

export interface KeywordRepo {
  create(input: CreateKeywordInput): Promise<Keyword>;
  getById(scope: TenantScope, id: string): Promise<Keyword | undefined>;
  list(scope: TenantScope): Promise<Keyword[]>;
  delete(scope: TenantScope, id: string): Promise<boolean>;
}

export interface RankSnapshotRepo {
  append(input: CreateRankSnapshotInput): Promise<RankSnapshot>;
  listByRange(query: SnapshotRangeQuery): Promise<RankSnapshot[]>;
}

export interface AuditRepo {
  create(audit: Omit<Audit, "createdAt">): Promise<Audit>;
  getById(scope: TenantScope, id: string): Promise<Audit | undefined>;
  list(scope: TenantScope): Promise<Audit[]>;
}

export interface ReportRepo {
  create(report: Omit<Report, "createdAt">): Promise<Report>;
  getById(scope: TenantScope, id: string): Promise<Report | undefined>;
  list(scope: TenantScope): Promise<Report[]>;
}

export interface DashboardConfigRepo {
  get(scope: TenantScope): Promise<DashboardConfig | undefined>;
  upsert(config: DashboardConfig): Promise<DashboardConfig>;
}

export interface RankStore {
  projects: ProjectRepo;
  keywords: KeywordRepo;
  snapshots: RankSnapshotRepo;
  audits: AuditRepo;
  reports: ReportRepo;
  dashboard: DashboardConfigRepo;
}

export interface PositionQuery {
  tenantId: string;
  projectId: string;
  keywordIds: string[];
  country: string;
  device: "desktop" | "mobile";
}

export interface RankDataSource {
  readonly id: string;
  readonly capabilities: {
    ownedOnly: boolean;
    realtime: boolean;
    competitors: boolean;
  };
  fetchPositions(input: PositionQuery): Promise<CreateRankSnapshotInput[]>;
}

export interface ScheduledJob {
  id: string;
  cron: string;
  handler: () => Promise<void>;
}

export interface Scheduler {
  register(job: ScheduledJob): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
