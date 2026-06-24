import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("rms_projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const keywords = sqliteTable("rms_keywords", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  text: text("text").notNull(),
  country: text("country").notNull(),
  device: text("device").notNull(),
  tags: text("tags").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const rankSnapshots = sqliteTable("rms_rank_snapshots", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  keywordId: text("keyword_id").notNull(),
  position: integer("position"),
  url: text("url"),
  source: text("source").notNull(),
  device: text("device").notNull(),
  country: text("country").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp_ms" }).notNull(),
  serpFeatures: text("serp_features"),
});

export const audits = sqliteTable("rms_audits", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const reports = sqliteTable("rms_reports", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  from: integer("from", { mode: "timestamp_ms" }).notNull(),
  to: integer("to", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const dashboardConfigs = sqliteTable("rms_dashboard_configs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  widgets: text("widgets").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const sqliteSchema = {
  projects,
  keywords,
  rankSnapshots,
  audits,
  reports,
  dashboardConfigs,
};
