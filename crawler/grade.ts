import type { Grade, RawItem, Stage } from "../shared/types";

const QUANT_RE = /(\d+(?:\.\d+)?\s*(?:%|pp|percentage points?|个百分点|倍|x|k|万|亿)|(?:million|billion))/i;
const PROD_RE = /(production|deployed|live traffic|in the wild|rollout|上线|生产环境|真实流量)/i;
const SCALE_RE = /(at scale|scaled to|all users|千万|亿级|规模化)/i;
const PILOT_RE = /(pilot|beta with|trial with|试点)/i;
const CASE_RE = /(customer|client|enterprise|企业|客户|业务场景)/i;
const RESULT_RE = /(improv|reduc| increas|decreas|提升|降低|缩短|节省|save|gain)/i;

const GRADE_RANK: Record<Grade, number> = { D: 0, C: 1, B: 2, A: 3 };
const GRADE_BASE: Record<Grade, number> = { D: 55, C: 65, B: 78, A: 85 };

export function ruleStage(raw: RawItem): Stage {
  const text = `${raw.title} ${raw.excerpt}`;
  if (SCALE_RE.test(text)) return "scale";
  if (PROD_RE.test(text)) return "production";
  if (PILOT_RE.test(text)) return "pilot";
  switch (raw.source_type) {
    case "product_update": return "product";
    case "customer_case": return "pilot";
    default: return "research";
  }
}

export function ruleGrade(raw: RawItem): Grade {
  const text = `${raw.title} ${raw.excerpt}`;
  const quant = QUANT_RE.test(text);
  const prod = PROD_RE.test(text);
  const cased = CASE_RE.test(text);
  const result = RESULT_RE.test(text);
  if (raw.primary) {
    if (quant && prod) return "A";
    if (cased && (result || quant)) return "B";
    return "C";
  }
  if (quant && prod && result) return "B";
  if (cased || result) return "C";
  return "D";
}

export function clampGrade(suggested: Grade | undefined, cap: Grade): Grade {
  if (!suggested) return cap;
  return GRADE_RANK[suggested] > GRADE_RANK[cap] ? cap : suggested;
}

export function evidenceScore(raw: RawItem, grade: Grade): number {
  const text = `${raw.title} ${raw.excerpt}`;
  let bonus = 0;
  if (QUANT_RE.test(text)) bonus += 3;
  if (PROD_RE.test(text)) bonus += 2;
  if (SCALE_RE.test(text)) bonus += 3;
  if (raw.primary) bonus += 2;
  return Math.min(100, GRADE_BASE[grade] + bonus);
}

export function evidenceReason(raw: RawItem): string {
  const parts: string[] = [];
  if (raw.primary) parts.push("一手来源");
  const text = `${raw.title} ${raw.excerpt}`;
  if (QUANT_RE.test(text)) parts.push("披露量化指标");
  if (PROD_RE.test(text)) parts.push("进入生产或真实流量");
  if (SCALE_RE.test(text)) parts.push("规模化信号");
  if (CASE_RE.test(text)) parts.push("场景或采用方明确");
  return parts.join("；") || "二手转述或早期线索";
}
