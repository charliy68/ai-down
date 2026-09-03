import { fetchWithTimeout } from "../http";
import type { RawItem } from "../../shared/types";

const GH = "https://api.github.com";

export const githubSearch = {
  id: "github-agent-projects",
  name: "GitHub · 活跃 AI Agent 项目",
  source_type: "agent_project" as const,
  primary: true,
  async fetch(): Promise<RawItem[]> {
    const q = encodeURIComponent("topic:ai-agent topic:llm pushed:>2026-08-01");
    const data = await (await fetchWithTimeout(`${GH}/search/repositories?q=${q}&sort=stars&order=desc&per_page=30`)).json();
    return (data.items ?? []).map((r: Record<string, unknown>) => ({
      source_id: "github-agent-projects", source_name: "GitHub · 活跃 AI Agent 项目",
      source_type: "agent_project" as const, primary: true,
      title: String(r.full_name),
      url: String(r.html_url),
      published_at: String(r.pushed_at),
      excerpt: `${String(r.description ?? "")} ★${r.stargazers_count}，最近推送 ${String(r.pushed_at).slice(0, 10)}`.slice(0, 600),
    }));
  },
};

const FRAMEWORKS = [
  "langchain-ai/langgraph", "microsoft/autogen", "crewAIInc/crewAI",
  "openai/openai-agents-python", "run-llama/llama_index", "langchain-ai/langchain",
];

export const githubReleases = {
  id: "github-agent-releases",
  name: "GitHub · Agent 框架版本发布",
  source_type: "product_update" as const,
  primary: true,
  async fetch(): Promise<RawItem[]> {
    const results = await Promise.allSettled(FRAMEWORKS.map(async repo => {
      const rel = await (await fetchWithTimeout(`${GH}/repos/${repo}/releases/latest`)).json();
      return {
        source_id: "github-agent-releases", source_name: "GitHub · Agent 框架版本发布",
        source_type: "product_update" as const, primary: true,
        title: `${repo} ${rel.tag_name ?? ""}`.trim(),
        url: String(rel.html_url ?? `https://github.com/${repo}`),
        published_at: String(rel.published_at ?? new Date().toISOString()),
        excerpt: String(rel.body ?? "").replace(/[#*`]/g, "").replace(/\s+/g, " ").slice(0, 600),
      };
    }));
    return results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<RawItem>).value);
  },
};
