import fs from "fs";
import RadarApp from "@/components/RadarApp";
import type { SiteData } from "@/shared/types";

export default function Page() {
  const data: SiteData = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
  return <RadarApp data={data} />;
}
