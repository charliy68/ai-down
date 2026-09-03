import type { RawItem } from "../shared/types";

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|ref$|source$)/i;

export function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !TRACKING_PARAMS.test(k));
    u.search = "";
    for (const [k, v] of params) u.searchParams.append(k, v);
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return input;
  }
}

export function dedupeAndDiff(newItems: RawItem[], existingUrls: Set<string>): RawItem[] {
  const seen = new Set<string>();
  const out: RawItem[] = [];
  for (const it of newItems) {
    const key = normalizeUrl(it.url);
    if (existingUrls.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it, url: key });
  }
  return out;
}
