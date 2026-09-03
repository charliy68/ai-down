import fs from "fs";
import path from "path";
import { SOURCES } from "./sources";
import { dedupeAndDiff } from "./dedupe";
import { ruleStage, ruleGrade, clampGrade, evidenceScore, evidenceReason } from "./grade";
import { enrich, generateBrief, llmEnabled } from "./llm";
import { siteDataSchema } from "../shared/schema";
import type { Grade, RawItem, Signal, SiteData, SourceHealth, Stage } from "../shared/types";

const DATA_PATH = path.resolve("data/site.json");
const MAX_ITEMS = 500;
const STALE_HOURS = 30;
const SITE_URL = process.env.SITE_URL ?? "https://radar.yuedu.biz";

const STAGE_LABELS: Record<Stage, string> = {
  research: "论文/技术", product: "产品发布", pilot: "试点验证", production: "生产部署", scale: "规模化",
};
const METHODOLOGY: Record<Grade, string> = {
  A: "生产数据、严谨现场实验或可复核的规模化结果",
  B: "真实客户与业务场景明确，并披露部署结果",
  C: "产品发布或试点线索，但业务结果不足",
  D: "评论、二手转述或尚待验证的早期线索",
};

function idFor(raw: RawItem): string {
  return Buffer.from(raw.url).toString("base64url").slice(0, 22);
}

async function main() {
  const started = Date.now();
  const existing: SiteData = fs.existsSync(DATA_PATH)
    ? JSON.parse(fs.readFileSync(DATA_PATH, "utf8"))
    : { meta: {} as never, brief: { headline: "", summary: "", themes: [] }, stages: [], trends: [], items: [], sources: [], methodology: METHODOLOGY };

  // ① 采集：并行抓全部源，失败记健康状态
  const healths: SourceHealth[] = [];
  const raws: RawItem[] = [];
  await Promise.all(SOURCES.map(async s => {
    try {
      const items = await s.fetch();
      healths.push({ id: s.id, name: s.name, source_type: s.source_type, primary: s.primary, status: "ok", count: items.length, error: "" });
      raws.push(...items);
    } catch (e) {
      healths.push({ id: s.id, name: s.name, source_type: s.source_type, primary: s.primary, status: "error", count: 0, error: String(e).slice(0, 200) });
    }
  }));

  // ② 去重：与库存 URL 对比筛新增
  const existingUrls = new Set(existing.items.map(s => s.url));
  const fresh = dedupeAndDiff(raws, existingUrls);
  const shortlisted = fresh; // 初筛即来源本身的相关性过滤（查询词已限定主题）

  // ③+④ 加工与定级
  const newSignals: Signal[] = [];
  for (const raw of shortlisted.slice(0, 40)) { // 每日最多加工 40 条，控成本
    const llm = await enrich(raw);
    const cap = ruleGrade(raw);
    const grade = clampGrade(llm?.suggested_grade, cap);
    const stage: Stage = llm?.suggested_stage && raw.primary ? llm.suggested_stage : ruleStage(raw);
    newSignals.push({
      id: idFor(raw),
      title: raw.title,
      title_zh: llm?.title_zh ?? "",
      url: raw.url,
      published_at: raw.published_at,
      source_id: raw.source_id,
      source_name: raw.source_name,
      source_type: raw.source_type,
      primary_source: raw.primary,
      stage,
      evidence_grade: grade,
      evidence_score: evidenceScore(raw, grade),
      evidence_reason: evidenceReason(raw),
      summary: llm?.summary ?? raw.excerpt,
      why_it_matters: llm?.why_it_matters ?? "",
      method: llm?.method ?? "",
      result: llm?.result ?? "",
      sector: llm?.sector ?? "跨行业",
      workflow: llm?.workflow ?? "",
      metric: llm?.metric ?? "",
      metric_label: llm?.metric_label ?? "",
      opportunity: llm?.opportunity ?? "",
      topics: llm?.topics?.length ? llm.topics : [STAGE_LABELS[stage]],
      ai_analyzed: Boolean(llm),
    });
    process.stdout.write(`+ ${grade} ${raw.title.slice(0, 60)}\n`);
  }

  // 合并 + 截断 500 条
  const items = [...newSignals, ...existing.items]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, MAX_ITEMS);

  // 统计与趋势（近 14 天 vs 前 14 天，按 topics 计数）
  const now = Date.now();
  const inWin = (s: Signal, from: number, to: number) => {
    const t = Date.parse(s.published_at); return t >= from && t < to;
  };
  const countTopics = (from: number, to: number) => {
    const m = new Map<string, number>();
    for (const s of items) if (inWin(s, from, to)) for (const t of s.topics) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };
  const cur = countTopics(now - 14 * 86400e3, now + 86400e3);
  const prev = countTopics(now - 28 * 86400e3, now - 14 * 86400e3);
  const trends = [...cur.entries()]
    .filter(([label]) => !/论文\/技术|产品发布|试点验证|生产部署|规模化/.test(label))
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([label, current]) => {
      const previous = prev.get(label) ?? 0;
      return { label, current, previous, delta: current - previous,
        direction: current > previous ? "up" as const : current < previous ? "down" as const : "flat" as const };
    });

  // brief：LLM 生成或模板降级
  const strong = items.filter(s => s.evidence_grade === "A" || s.evidence_grade === "B");
  const briefLlm = await generateBrief(strong);
  const brief = {
    headline: briefLlm?.headline || `生产信号集中在「${trends[0]?.label ?? "通用企业工作流"}」`,
    summary: briefLlm?.summary || `本期有 ${strong.length} 条生产或规模化信号达到 A/B 级。`,
    themes: trends.slice(0, 4).map(t => t.label),
  };

  const sourceSuccess = healths.filter(h => h.status === "ok").length;
  const data: SiteData = {
    meta: {
      name: "AI 落地雷达", generated_at: new Date().toISOString(), timezone: "Asia/Shanghai",
      site_url: SITE_URL, schedule: "07:30",
      health: sourceSuccess >= SOURCES.length - 2 ? "ok" : "warning",
      stale_after_hours: STALE_HOURS,
      raw_count: raws.length, shortlisted_count: shortlisted.length, inserted_count: newSignals.length,
      total_items: items.length, strong_items: strong.length,
      paper_items: items.filter(s => s.source_type === "paper").length,
      source_success: sourceSuccess, source_attempted: SOURCES.length,
      duration_seconds: Math.round((Date.now() - started) / 100) / 10,
    },
    brief,
    stages: (Object.keys(STAGE_LABELS) as Stage[]).map(key => ({
      key, label: STAGE_LABELS[key], count: items.filter(s => s.stage === key).length,
    })),
    trends, items, sources: healths, methodology: METHODOLOGY,
  };

  const parsed = siteDataSchema.safeParse(data);
  if (!parsed.success) {
    console.error("SCHEMA 校验失败：", parsed.error.issues.slice(0, 10));
    process.exit(1); // 坏数据不落盘不提交
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`完成：新增 ${newSignals.length} 条，总计 ${items.length} 条，耗时 ${data.meta.duration_seconds}s，LLM ${llmEnabled() ? "启用" : "未启用"}，源 ${sourceSuccess}/${SOURCES.length} 正常`);
}

main().catch(e => { console.error("管线失败：", e); process.exit(1); });
