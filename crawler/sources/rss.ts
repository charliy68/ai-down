import Parser from "rss-parser";
import type { RawItem } from "../../shared/types";

const p = new Parser({ timeout: 30_000 });

function feed(id: string, name: string, url: string, primary: boolean, sourceType: RawItem["source_type"]) {
  return {
    id, name, source_type: sourceType, primary,
    async fetch(): Promise<RawItem[]> {
      const out = await p.parseURL(url);
      return (out.items ?? []).slice(0, 20).map(it => ({
        source_id: id, source_name: name, source_type: sourceType, primary,
        title: it.title ?? "",
        url: it.link ?? "",
        published_at: it.isoDate ?? new Date().toISOString(),
        excerpt: (it.contentSnippet ?? it.content ?? "").slice(0, 600),
      })).filter(x => x.url);
    },
  };
}

export const openaiNews = feed("openai-news", "OpenAI News",
  "https://openai.com/news/rss.xml", true, "product_update");
export const googleAiBlog = feed("google-ai-blog", "Google AI Blog",
  "https://blog.google/technology/ai/rss/", true, "product_update");
export const awsMlBlog = feed("aws-ml-blog", "AWS ML Blog",
  "https://aws.amazon.com/blogs/machine-learning/feed/", true, "product_update");
