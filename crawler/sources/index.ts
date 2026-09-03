import { arxivEnterprise, arxivWorkflow } from "./arxiv";
import { githubSearch, githubReleases } from "./github";
import { openaiNews, googleAiBlog, awsMlBlog } from "./rss";
import { hackerNews } from "./hn";
import type { RawItem } from "../../shared/types";

export interface SourceAdapter {
  id: string;
  name: string;
  source_type: "paper" | "product_update" | "customer_case" | "news" | "community" | "agent_project" | "curated_papers";
  primary: boolean;
  fetch(): Promise<RawItem[]>;
}

export const SOURCES: SourceAdapter[] = [
  arxivEnterprise, arxivWorkflow,
  githubSearch, githubReleases,
  openaiNews, googleAiBlog, awsMlBlog,
  hackerNews,
];
