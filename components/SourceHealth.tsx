import type { SourceHealth as SH } from "@/shared/types";

const TYPE_LABEL: Record<string, string> = {
  paper: "论文", curated_papers: "精选论文", product_update: "产品", customer_case: "案例",
  news: "新闻", community: "社区", agent_project: "Agent 项目", rss: "RSS",
  github_search: "GitHub 搜索", github_releases: "GitHub 发布", hacker_news: "HN",
};

export default function SourceHealthSection({ sources }: { sources: SH[] }) {
  return (
    <section className="source-section" id="sources">
      <div className="section-title">
        <div><span className="section-index">05</span><h2>信息源健康</h2></div>
        <p>任一来源失败不会拖垮整条管线；异常会明确显示，避免静默停摆。</p>
      </div>
      <div className="source-table">
        {sources.map(s => (
          <div key={s.id}>
            <span className={`source-dot ${s.status}`} />
            <b>{s.name}</b>
            <span>{TYPE_LABEL[s.source_type] ?? s.source_type}</span>
            <span>{s.primary ? "一手/原始" : "发现/聚合"}</span>
            <em>{s.status === "ok" ? `${s.count} 条` : s.status === "not_run" ? "本轮未运行" : "需要检查"}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
