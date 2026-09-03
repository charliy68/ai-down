"use client";
import type { Stage } from "@/shared/types";

export const STAGE_META: Record<Stage, { label: string; color: string; index: string }> = {
  research:   { label: "论文/技术", color: "var(--sky)",     index: "01" },
  product:    { label: "产品发布", color: "var(--violet)",  index: "02" },
  pilot:      { label: "试点验证", color: "var(--amber)",   index: "03" },
  production: { label: "生产部署", color: "var(--emerald)", index: "04" },
  scale:      { label: "规模化",   color: "var(--cyan)",    index: "05" },
};

export default function StageTrack({
  stages, selected, onSelect,
}: {
  stages: { key: Stage; label: string; count: number }[];
  selected: Stage | null;
  onSelect: (s: Stage | null) => void;
}) {
  return (
    <section className="stage-panel" aria-label="从技术到规模化">
      <div className="section-title">
        <div><span className="section-index">01</span><h2>从技术到规模化</h2></div>
        <p>同一条信息只有进入更深的落地阶段，权重才会上升；点击阶段可筛选信号库。</p>
      </div>
      <div className="stage-track">
        {stages.map(s => (
          <button key={s.key} className="stage"
            style={{ ["--stage-c" as string]: STAGE_META[s.key].color }}
            data-selected={selected === s.key}
            onClick={() => onSelect(selected === s.key ? null : s.key)}>
            <div className="stage-top"><span>{STAGE_META[s.key].index}</span><strong>{s.count}</strong></div>
            <p>{s.label}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
