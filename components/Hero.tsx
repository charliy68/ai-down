import type { SiteData } from "@/shared/types";

export default function Hero({ brief, total }: { brief: SiteData["brief"]; total: number }) {
  return (
    <section className="hero" id="top">
      <div>
        <p className="eyebrow">DAILY ENTERPRISE AI INTELLIGENCE</p>
        <h1>AI 落地与<br />企业应用雷达</h1>
        <p className="lede">
          不追逐所有 AI 新闻，只追踪技术如何穿过产品、试点与生产环境，最后变成可验证的业务结果。当前库存 {total} 条。
        </p>
      </div>
      <aside className="brief-card">
        <div className="brief-head"><span>今日判断</span><span>系统正常</span></div>
        <div>
          <h2>{brief.headline}</h2>
          <p>{brief.summary}</p>
        </div>
        <div className="brief-tags">{brief.themes.map(t => <span key={t}>{t}</span>)}</div>
      </aside>
    </section>
  );
}
