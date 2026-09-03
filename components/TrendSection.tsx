import type { SiteData } from "@/shared/types";

export default function TrendSection({ trends }: { trends: SiteData["trends"] }) {
  const max = Math.max(...trends.map(t => t.current), 1);
  return (
    <section className="trend-section">
      <div className="section-title compact-title">
        <div><span className="section-index">03</span><h2>近 14 天动向</h2></div>
        <p>与此前 14 天对比；这是信号数量变化，不等同于市场份额。</p>
      </div>
      <div className="trend-layout">
        <div className="trend-list">
          {trends.map(t => (
            <div className="trend-row" key={t.label}>
              <div><b>{t.label}</b><span>{t.current} 条</span></div>
              <div className="trend-bar"><span style={{ width: `${(t.current / max) * 100}%` }} /></div>
              <em className={t.direction}>{t.direction === "up" ? "+" : ""}{t.delta}</em>
            </div>
          ))}
        </div>
        <aside className="signal-standard">
          <span>强信号的最低结构</span>
          <ol>
            <li><b>谁</b>在真实使用，而非只说"面向企业"</li>
            <li><b>在哪个流程</b>中替代或增强了什么工作</li>
            <li><b>如何验证</b>，有没有基线、样本与时间窗</li>
            <li><b>结果如何</b>，是否披露成本、质量或业务指标</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
