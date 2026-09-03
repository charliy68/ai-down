import type { Signal } from "@/shared/types";
import { STAGE_META } from "./StageTrack";

export default function SignalCard({ signal, featured = false }: { signal: Signal; featured?: boolean }) {
  return (
    <article className={`signal-card${featured ? " signal-featured" : ""}`}>
      <div className="card-meta">
        <span className={`grade grade-${signal.evidence_grade.toLowerCase()}`}>{signal.evidence_grade}</span>
        <span>{signal.source_name}</span><span>·</span>
        <span>{STAGE_META[signal.stage].label}</span>
        <span className="score">{signal.evidence_score}</span>
      </div>
      <h3>{signal.title_zh || signal.title}</h3>
      <p className="card-summary">{signal.summary}</p>
      <div className="why-line"><b>为什么重要</b><span>{signal.why_it_matters}</span></div>
      {signal.metric && (
        <div className="metric"><strong>{signal.metric}</strong><span>{signal.metric_label}</span></div>
      )}
      <div className="topic-row">{signal.topics.map(t => <span key={t}>{t}</span>)}</div>
      <a className="source-link" href={signal.url} target="_blank" rel="noreferrer"
        aria-label={`查看原始来源：${signal.title_zh || signal.title}`}>
        <span>{signal.source_name} ↗</span>
        <span>{signal.published_at.slice(0, 10)}</span>
      </a>
    </article>
  );
}
