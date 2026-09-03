import { fetchWithTimeout } from "../http";
import type { RawItem } from "../../shared/types";

export const hackerNews = {
  id: "hn-enterprise-ai",
  name: "Hacker News · 产品与开发者反馈",
  source_type: "community" as const,
  primary: false,
  async fetch(): Promise<RawItem[]> {
    const q = encodeURIComponent('"AI agent" OR "LLM"');
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=story&numericFilters=points>80&hitsPerPage=30`;
    const data = await (await fetchWithTimeout(url)).json();
    return (data.hits ?? []).map((h: Record<string, unknown>) => ({
      source_id: "hn-enterprise-ai", source_name: "Hacker News · 产品与开发者反馈",
      source_type: "community" as const, primary: false,
      title: String(h.title ?? ""),
      url: String(h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`),
      published_at: new Date(Number(h.created_at_i) * 1000).toISOString(),
      excerpt: `${h.points ?? 0} 分 ${h.num_comments ?? 0} 评论`,
    })).filter((x: RawItem) => x.url);
  },
};
