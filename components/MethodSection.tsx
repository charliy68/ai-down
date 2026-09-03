import type { SiteData } from "@/shared/types";

const GRADES: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

export default function MethodSection({ methodology }: { methodology: SiteData["methodology"] }) {
  return (
    <section className="method-section" id="method">
      <div className="section-title">
        <div><span className="section-index">04</span><h2>证据怎么分级</h2></div>
        <p>规则引擎先给证据上限；即使接入模型，模型也只能降级或改善表述，不能凭空升级。</p>
      </div>
      <div className="method-grid">
        {GRADES.map(g => (
          <div key={g}>
            <span className={`grade grade-${g.toLowerCase()}`}>{g}</span>
            <p>{methodology[g]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
