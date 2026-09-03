"use client";
import type { Grade, SourceType, Stage } from "@/shared/types";
import { STAGE_META } from "./StageTrack";

const GRADES: Grade[] = ["A", "B", "C", "D"];
const SOURCE_TYPES: { key: SourceType; label: string }[] = [
  { key: "paper", label: "论文" }, { key: "curated_papers", label: "精选论文" },
  { key: "product_update", label: "产品" }, { key: "customer_case", label: "案例" },
  { key: "news", label: "新闻" }, { key: "community", label: "社区" },
  { key: "agent_project", label: "Agent 项目" },
];

export interface FilterState {
  query: string; grade: Grade | null; stage: Stage | null; source: SourceType | null;
}

export default function FilterPanel({
  state, onChange, resultCount,
}: {
  state: FilterState;
  onChange: (s: FilterState) => void;
  resultCount: number;
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });
  return (
    <div className="filter-panel">
      <label className="search-box">
        <span>⌕</span>
        <input placeholder="搜索公司、行业、工作流或主题" value={state.query}
          onChange={e => set({ query: e.target.value })} />
      </label>
      <div className="filter-group" aria-label="证据等级筛选">
        <button className={!state.grade ? "selected" : ""} onClick={() => set({ grade: null })}>全部等级</button>
        {GRADES.map(g => (
          <button key={g} className={state.grade === g ? "selected" : ""}
            onClick={() => set({ grade: state.grade === g ? null : g })}>{g} 级</button>
        ))}
      </div>
      <div className="filter-group" aria-label="阶段筛选">
        <button className={!state.stage ? "selected" : ""} onClick={() => set({ stage: null })}>全部阶段</button>
        {(Object.keys(STAGE_META) as Stage[]).map(s => (
          <button key={s} className={state.stage === s ? "selected" : ""}
            onClick={() => set({ stage: state.stage === s ? null : s })}>{STAGE_META[s].label}</button>
        ))}
      </div>
      <div className="filter-group" aria-label="来源筛选">
        <button className={!state.source ? "selected" : ""} onClick={() => set({ source: null })}>全部来源</button>
        {SOURCE_TYPES.map(t => (
          <button key={t.key} className={state.source === t.key ? "selected" : ""}
            onClick={() => set({ source: state.source === t.key ? null : t.key })}>{t.label}</button>
        ))}
      </div>
      <div className="filter-result">
        <span>找到 {resultCount} 条</span>
        <button onClick={() => onChange({ query: "", grade: null, stage: null, source: null })}>清空筛选</button>
      </div>
    </div>
  );
}
