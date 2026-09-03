import { describe, it, expect } from "vitest";
import { normalizeUrl, dedupeAndDiff } from "../crawler/dedupe";
import type { RawItem } from "../shared/types";

const item = (url: string): RawItem => ({
  source_id: "x", source_name: "x", source_type: "news", primary: false,
  title: "t", url, published_at: "2026-09-01T00:00:00Z", excerpt: "",
});

describe("normalizeUrl", () => {
  it("去除 utm 与跟踪参数", () => {
    expect(normalizeUrl("https://a.com/p?utm_source=x&id=1")).toBe("https://a.com/p?id=1");
  });
  it("去除尾斜杠并统一小写 host", () => {
    expect(normalizeUrl("https://A.com/p/")).toBe("https://a.com/p");
  });
  it("去除 hash", () => {
    expect(normalizeUrl("https://a.com/p#top")).toBe("https://a.com/p");
  });
  it("根路径保留尾斜杠", () => {
    expect(normalizeUrl("https://a.com/")).toBe("https://a.com/");
  });
});

describe("dedupeAndDiff", () => {
  it("按归一化 URL 去重（含库存）", () => {
    const existing = new Set(["https://a.com/p"]);
    const out = dedupeAndDiff([
      item("https://a.com/p?utm_campaign=1"), // 与库存重复
      item("https://a.com/p/"),               // 与库存重复
      item("https://b.com/q"),                 // 新增
      item("https://b.com/q?fbclid=z"),        // 批内重复
    ], existing);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://b.com/q");
  });
});
