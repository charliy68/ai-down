import fs from "fs";
import type { SiteData } from "@/shared/types";

export const dynamic = "force-static";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const data: SiteData = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
  const items = data.items.slice(0, 30).map(s => `
    <item>
      <title>${esc(s.title_zh || s.title)}</title>
      <link>${esc(s.url)}</link>
      <guid isPermaLink="true">${esc(s.url)}</guid>
      <pubDate>${new Date(s.published_at).toUTCString()}</pubDate>
      <description>${esc(s.summary)}</description>
    </item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>AI 落地雷达</title>
<link>https://radar.yuedu.biz</link>
<description>从论文到生产，追踪可验证的企业 AI 信号。</description>
<lastBuildDate>${new Date(data.meta.generated_at).toUTCString()}</lastBuildDate>
${items}
</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
