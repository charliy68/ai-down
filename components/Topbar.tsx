"use client";
import type { Meta } from "@/shared/types";

export default function Topbar({ meta }: { meta: Meta }) {
  const stale = Date.now() - Date.parse(meta.generated_at) > meta.stale_after_hours * 3600_000;
  const updated = new Date(meta.generated_at).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="AI 落地雷达首页">
        <span className="brand-mark">R</span><span>REALITY / AI</span>
      </a>
      <nav className="nav" aria-label="主导航">
        <a href="#today">今日信号</a>
        <a href="#library">信号库</a>
        <a href="#method">证据方法</a>
        <a href="#sources">信息源</a>
      </nav>
      <div className={`live-pill${stale ? " stale" : ""}`}>
        <span />{updated} {stale ? "数据过期" : "已更新"}
      </div>
    </header>
  );
}
