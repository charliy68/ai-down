import { describe, it, expect } from "vitest";
import { ruleStage, ruleGrade, clampGrade, evidenceScore } from "../crawler/grade";
import type { RawItem } from "../shared/types";

const raw = (o: Partial<RawItem>): RawItem => ({
  source_id: "s", source_name: "s", source_type: "paper", primary: true,
  title: "t", url: "https://a.com/1", published_at: "2026-09-01T00:00:00Z",
  excerpt: "", ...o,
});

describe("ruleStage", () => {
  it("论文类型默认 research", () => {
    expect(ruleStage(raw({ source_type: "paper" }))).toBe("research");
  });
  it("产品更新默认 product", () => {
    expect(ruleStage(raw({ source_type: "product_update" }))).toBe("product");
  });
  it("关键词 production/deployed 提升为 production", () => {
    expect(ruleStage(raw({ excerpt: "deployed in production with live traffic" }))).toBe("production");
  });
  it("关键词 scale/at scale 提升为 scale", () => {
    expect(ruleStage(raw({ excerpt: "rolled out at scale to all users" }))).toBe("scale");
  });
  it("关键词 pilot 提升为 pilot", () => {
    expect(ruleStage(raw({ excerpt: "a pilot program with 5 customers" }))).toBe("pilot");
  });
});

describe("ruleGrade", () => {
  it("一手 + 量化结果 + 生产环境 → A", () => {
    const r = raw({ excerpt: "deployed in production, improved QA rate by 9.0 percentage points" });
    expect(ruleGrade(r)).toBe("A");
  });
  it("一手 + 客户场景 + 结果（不量化）→ B", () => {
    const r = raw({ excerpt: "customer deployed the agent for their support workflow with reduced cost" });
    expect(ruleGrade(r)).toBe("B");
  });
  it("产品发布无业务结果 → C", () => {
    expect(ruleGrade(raw({ source_type: "product_update", excerpt: "we are launching a new model" }))).toBe("C");
  });
  it("二手/社区来源 → D", () => {
    expect(ruleGrade(raw({ primary: false, source_type: "community" }))).toBe("D");
  });
  it("量化+生产但二手来源最多 B", () => {
    const r = raw({ primary: false, excerpt: "deployed in production, 30% improvement" });
    expect(ruleGrade(r)).toBe("B");
  });
});

describe("clampGrade", () => {
  it("LLM 建议可降不可升", () => {
    expect(clampGrade("A", "B")).toBe("B"); // 建议A，上限B → B
    expect(clampGrade("C", "B")).toBe("C"); // 建议C，上限B → C
    expect(clampGrade(undefined, "B")).toBe("B");
  });
});

describe("evidenceScore", () => {
  it("A 分数高于 B，B 高于 C", () => {
    const r = raw({});
    expect(evidenceScore(r, "A")).toBeGreaterThan(evidenceScore(r, "B"));
    expect(evidenceScore(r, "B")).toBeGreaterThan(evidenceScore(r, "C"));
  });
  it("分数在 0-100", () => {
    const r = raw({ excerpt: "deployed in production at scale with 3x improvement" });
    const s = evidenceScore(r, "A");
    expect(s).toBeGreaterThan(0); expect(s).toBeLessThanOrEqual(100);
  });
});
