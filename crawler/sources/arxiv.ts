import { XMLParser } from "fast-xml-parser";
import { fetchWithTimeout } from "../http";
import type { RawItem } from "../../shared/types";

const P = new XMLParser({ ignoreAttributes: false });

async function query(sourceId: string, sourceName: string, searchQuery: string): Promise<RawItem[]> {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&sortBy=submittedDate&sortOrder=descending&max_results=25`;
  const xml = await (await fetchWithTimeout(url)).text();
  const feed = P.parse(xml).feed;
  const entries = [].concat(feed.entry ?? []).map((e: Record<string, unknown>) => {
    const link = Array.isArray(e.link)
      ? (e.link.find((l: Record<string, unknown>) => l["@_href"]) as Record<string, string>)["@_href"]
      : (e.link as Record<string, string>)["@_href"];
    return {
      source_id: sourceId, source_name: sourceName, source_type: "paper" as const, primary: true,
      title: String(e.title).replace(/\s+/g, " ").trim(),
      url: link,
      published_at: String(e.published),
      excerpt: String(e.summary).replace(/\s+/g, " ").trim().slice(0, 600),
    };
  });
  return entries;
}

export const arxivEnterprise = {
  id: "arxiv-enterprise-agent",
  name: "arXiv · 企业 Agent / 生产部署",
  source_type: "paper" as const,
  primary: true,
  fetch: () => query("arxiv-enterprise-agent", "arXiv · 企业 Agent / 生产部署",
    'all:"enterprise" AND all:"agent"'),
};

export const arxivWorkflow = {
  id: "arxiv-ai-workflow",
  name: "arXiv · AI 与业务工作流",
  source_type: "paper" as const,
  primary: true,
  fetch: () => query("arxiv-ai-workflow", "arXiv · AI 与业务工作流",
    'all:"LLM" AND (all:"workflow" OR all:"enterprise")'),
};
