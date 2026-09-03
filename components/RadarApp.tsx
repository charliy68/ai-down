"use client";
import { useMemo, useState } from "react";
import type { SiteData, SourceType } from "@/shared/types";
import Topbar from "./Topbar";
import Hero from "./Hero";
import Scoreboard from "./Scoreboard";
import StageTrack from "./StageTrack";
import SignalCard from "./SignalCard";
import FilterPanel, { type FilterState } from "./FilterPanel";
import TrendSection from "./TrendSection";
import MethodSection from "./MethodSection";
import SourceHealthSection from "./SourceHealth";
import Footer from "./Footer";

const PAGE_SIZE = 12;

export default function RadarApp({ data }: { data: SiteData }) {
  const [filter, setFilter] = useState<FilterState>({ query: "", grade: null, stage: null, source: null });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    return data.items.filter(s => {
      if (filter.grade && s.evidence_grade !== filter.grade) return false;
      if (filter.stage && s.stage !== filter.stage) return false;
      if (filter.source && s.source_type !== filter.source) return false;
      if (q && ![s.title, s.title_zh, s.summary, s.source_name, ...s.topics]
        .join("\n").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.items, filter]);

  const featured = useMemo(
    () => data.items.filter(s => s.evidence_grade === "A" || s.evidence_grade === "B").slice(0, 3),
    [data.items],
  );

  const setStage = (stage: SiteData["stages"][number]["key"] | null) => {
    setFilter(f => ({ ...f, stage }));
    setVisible(PAGE_SIZE);
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Topbar meta={data.meta} />
      <Hero brief={data.brief} total={data.meta.total_items} />
      <Scoreboard meta={data.meta} />
      <StageTrack stages={data.stages} selected={filter.stage} onSelect={setStage} />

      <section id="today">
        <div className="section-title">
          <div><span className="section-index">02</span><h2>当前最值得看</h2></div>
          <p>A 级要求生产数据或严谨现场实验；B 级要求真实客户、业务场景与结果。</p>
        </div>
        <div className="signal-grid">
          {featured.map(s => <SignalCard key={s.id} signal={s} featured />)}
        </div>
      </section>

      <TrendSection trends={data.trends} />

      <section id="library" style={{ marginTop: 64 }}>
        <div className="section-title">
          <div><span className="section-index">06</span><h2>全部信号</h2></div>
          <p>论文是一等来源，同时与产品、客户案例和社区反馈交叉验证。</p>
        </div>
        <FilterPanel state={filter} onChange={f => { setFilter(f); setVisible(PAGE_SIZE); }} resultCount={filtered.length} />
        {data.items.length === 0 ? (
          <div className="empty-state">等待首次采集，运行 npm run crawl 生成数据。</div>
        ) : (
          <>
            <div className="signal-grid">
              {filtered.slice(0, visible).map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
            {visible < filtered.length && (
              <button className="load-more" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                再看 12 条 ↓（剩余 {filtered.length - visible}）
              </button>
            )}
          </>
        )}
      </section>

      <MethodSection methodology={data.methodology} />
      <SourceHealthSection sources={data.sources} />
      <Footer />
    </>
  );
}
