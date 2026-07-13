import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const projects = pgTable("rms_projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const keywords = pgTable("rms_keywords", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  text: text("text").notNull(),
  country: text("country").notNull(),
  device: text("device").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const rankSnapshots = pgTable("rms_rank_snapshots", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  keywordId: text("keyword_id").notNull(),
  position: integer("position"),
  url: text("url"),
  source: text("source").notNull(),
  device: text("device").notNull(),
  country: text("country").notNull(),
  capturedAt: timestamp("captured_at", { withTimezone: true, mode: "date" }).notNull(),
  serpFeatures: jsonb("serp_features").$type<Record<string, unknown>>(),
});

export const audits = pgTable("rms_audits", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  checks: jsonb("checks").$type<unknown[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const reports = pgTable("rms_reports", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  from: timestamp("from", { withTimezone: true, mode: "date" }).notNull(),
  to: timestamp("to", { withTimezone: true, mode: "date" }).notNull(),
  summary: jsonb("summary").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const dashboardConfigs = pgTable("rms_dashboard_configs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  widgets: jsonb("widgets").$type<unknown[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const blogPosts = pgTable("rms_blog_posts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull().default(""),
  targetKeyword: text("target_keyword").notNull().default(""),
  intent: text("intent").notNull().default("informational"),
  metaTitle: text("meta_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const postgresSchema = {
  projects,
  keywords,
  rankSnapshots,
  audits,
  reports,
  dashboardConfigs,
  blogPosts,
};
