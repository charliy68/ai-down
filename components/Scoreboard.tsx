import type { Meta } from "@/shared/types";

export default function Scoreboard({ meta }: { meta: Meta }) {
  const cells: [string | number, string][] = [
    [meta.raw_count, "原始信号"],
    [meta.shortlisted_count, "通过初筛"],
    [meta.total_items, "有效信号"],
    [meta.paper_items, "论文信号"],
    [meta.strong_items, "A / B 级证据"],
    [`${meta.source_success}/${meta.source_attempted}`, "信息源正常"],
  ];
  return (
    <section className="scoreboard" aria-label="本轮雷达统计">
      {cells.map(([v, label]) => (
        <div key={label}><strong>{v}</strong><span>{label}</span></div>
      ))}
    </section>
  );
}
