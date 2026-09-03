export type Stage = "research" | "product" | "pilot" | "production" | "scale";
export type Grade = "A" | "B" | "C" | "D";
export type SourceType =
  | "paper" | "curated_papers" | "product_update"
  | "customer_case" | "news" | "community" | "agent_project";

export interface RawItem {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  primary: boolean;
  title: string;
  url: string;
  published_at: string; // ISO 8601
  excerpt: string;
}

export interface Signal {
  id: string;
  title: string;
  title_zh: string;
  url: string;
  published_at: string;
  source_id: string;
  source_name: string;
  source_type: SourceType;
  primary_source: boolean;
  stage: Stage;
  evidence_grade: Grade;
  evidence_score: number;
  evidence_reason: string;
  summary: string;
  why_it_matters: string;
  method: string;
  result: string;
  sector: string;
  workflow: string;
  metric: string;
  metric_label: string;
  opportunity: string;
  topics: string[];
  ai_analyzed: boolean;
}

export interface SourceHealth {
  id: string;
  name: string;
  source_type: SourceType;
  primary: boolean;
  status: "ok" | "error" | "not_run";
  count: number;
  error: string;
}

export interface Meta {
  name: string;
  generated_at: string;
  timezone: "Asia/Shanghai";
  site_url: string;
  schedule: string;
  health: "ok" | "warning" | "stale";
  stale_after_hours: number;
  raw_count: number;
  shortlisted_count: number;
  inserted_count: number;
  total_items: number;
  strong_items: number;
  paper_items: number;
  source_success: number;
  source_attempted: number;
  duration_seconds: number;
}

export interface SiteData {
  meta: Meta;
  brief: { headline: string; summary: string; themes: string[] };
  stages: { key: Stage; label: string; count: number }[];
  trends: { label: string; current: number; previous: number; delta: number; direction: "up" | "down" | "flat" }[];
  items: Signal[];
  sources: SourceHealth[];
  methodology: Record<Grade, string>;
}
