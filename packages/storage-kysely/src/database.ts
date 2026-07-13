export interface ProjectsTable {
  id: string;
  tenant_id: string;
  name: string;
  domain: string;
  created_at: Date;
  updated_at: Date;
}

export interface KeywordsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  text: string;
  country: string;
  device: string;
  tags: unknown;
  created_at: Date;
}

export interface RankSnapshotsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  keyword_id: string;
  position: number | null;
  url: string | null;
  source: string;
  device: string;
  country: string;
  captured_at: Date;
  serp_features: unknown | null;
}

export interface AuditsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  url: string;
  score: number;
  checks: unknown;
  created_at: Date;
}

export interface ReportsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  from: Date;
  to: Date;
  summary: unknown | null;
  created_at: Date;
}

export interface DashboardConfigsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  widgets: unknown;
  updated_at: Date;
}

export interface BlogPostsTable {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  slug: string;
  content: string;
  target_keyword: string;
  intent: string;
  meta_title: string;
  meta_description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Database {
  rms_projects: ProjectsTable;
  rms_keywords: KeywordsTable;
  rms_rank_snapshots: RankSnapshotsTable;
  rms_audits: AuditsTable;
  rms_reports: ReportsTable;
  rms_dashboard_configs: DashboardConfigsTable;
  rms_blog_posts: BlogPostsTable;
}
