import type { RawItem, Signal, Grade, Stage } from "../shared/types";

const BASE_URL = process.env.MINIMAX_BASE_URL ?? "https://api.minimaxi.com/v1";
const MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M3";
const KEY = process.env.MINIMAX_API_KEY;

export function llmEnabled(): boolean {
  return Boolean(KEY);
}

async function chat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`MiniMax HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function chatWithRetry(messages: { role: string; content: string }[], retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try { return await chat(messages); }
    catch (e) { if (i === retries) throw e; await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
  }
  throw new Error("unreachable");
}

function parseJsonLoose(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

const ENRICH_SYSTEM = `你是企业 AI 情报分析师。给定一条英文技术信号，产出 JSON（不要输出其他文字）：
{"title_zh":"20字内中文标题","summary":"150字内中文摘要，聚焦业务场景/机制/结果","why_it_matters":"为什么重要，30字内","metric":"核心量化指标值(如 +9.0pp、3.2x)，无则空串","metric_label":"指标名，无则空串","method":"采用的方法/机制，40字内","result":"可验证结果描述，无则空串","sector":"行业，如 软件与互联网","workflow":"业务工作流，如 客户服务","opportunity":"对企业的机会点，30字内","topics":["主题1","主题2","主题3"],"suggested_grade":"A|B|C|D","suggested_stage":"research|product|pilot|production|scale"}
评级参考：A=生产数据/严谨实验/可复核规模化结果；B=真实客户+业务场景+部署结果；C=产品发布或试点但业务结果不足；D=评论/二手/早期线索。`;

export async function enrich(raw: RawItem): Promise<Partial<Signal> & { suggested_grade?: Grade; suggested_stage?: Stage } | null> {
  if (!llmEnabled()) return null;
  try {
    const text = await chatWithRetry([
      { role: "system", content: ENRICH_SYSTEM },
      { role: "user", content: `来源：${raw.source_name}（${raw.primary ? "一手" : "聚合"}）\n标题：${raw.title}\n摘要：${raw.excerpt}` },
    ]);
    const j = parseJsonLoose(text);
    if (!j) return null;
    return {
      title_zh: String(j.title_zh ?? ""),
      summary: String(j.summary ?? ""),
      why_it_matters: String(j.why_it_matters ?? ""),
      method: String(j.method ?? ""),
      result: String(j.result ?? ""),
      sector: String(j.sector ?? "跨行业"),
      workflow: String(j.workflow ?? ""),
      metric: String(j.metric ?? ""),
      metric_label: String(j.metric_label ?? ""),
      opportunity: String(j.opportunity ?? ""),
      topics: Array.isArray(j.topics) ? j.topics.map(String).slice(0, 4) : [],
      ...(j.suggested_grade ? { suggested_grade: j.suggested_grade as Grade } : {}),
      ...(j.suggested_stage ? { suggested_stage: j.suggested_stage as Stage } : {}),
    };
  } catch {
    return null; // 失败降级，不阻塞管线
  }
}

export async function generateBrief(top: Signal[]): Promise<{ headline: string; summary: string } | null> {
  if (!llmEnabled() || top.length === 0) return null;
  try {
    const text = await chatWithRetry([
      { role: "system", content: `你是企业 AI 情报编辑。根据给定的强信号列表，输出 JSON：{"headline":"今日判断标题，20字内","summary":"两句话概括强信号共性，80字内"}。不要输出其他文字。` },
      { role: "user", content: top.slice(0, 7).map(s => `- ${s.title_zh || s.title}（${s.evidence_grade} 级）`).join("\n") },
    ]);
    const j = parseJsonLoose(text);
    if (!j) return null;
    return { headline: String(j.headline ?? ""), summary: String(j.summary ?? "") };
  } catch {
    return null;
  }
}
