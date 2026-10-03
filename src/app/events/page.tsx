import type { Metadata } from "next";
import { catalogue } from "@/lib/catalogue";
import PageFrame from "@/components/site/PageFrame";
import EventExplorer from "@/components/site/EventExplorer";
export const metadata: Metadata = { title: "Discover events" };
export const dynamic = "force-dynamic";
export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams; const { events, preview } = await catalogue(); const get = (k: string) => typeof params[k] === "string" ? params[k] as string : "";
  return <PageFrame><main id="main" className="wrap page-content">{preview && <p className="inline-preview">Example events · Design preview</p>}<p className="eyebrow">MAKE A PLAN</p><h1>{get("category") ? `${get("category")} events` : get("city") ? `What’s on in ${get("city")}` : "Find your next event."}</h1><p className="page-lead">The music, the crowd, the moment. Pick your next plan.</p><EventExplorer key={[get("q"),get("category"),get("city")].join("|")} events={events} initialQuery={get("q")} initialCategory={get("category")} initialCity={get("city")} /></main></PageFrame>;
}
