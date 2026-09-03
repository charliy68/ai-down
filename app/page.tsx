import fs from "fs";
import Topbar from "@/components/Topbar";
import Hero from "@/components/Hero";
import Scoreboard from "@/components/Scoreboard";
import Footer from "@/components/Footer";
import type { SiteData } from "@/shared/types";

export default function Page() {
  const data: SiteData = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
  return (
    <>
      <Topbar meta={data.meta} />
      <Hero brief={data.brief} total={data.meta.total_items} />
      <Scoreboard meta={data.meta} />
      <Footer />
    </>
  );
}
