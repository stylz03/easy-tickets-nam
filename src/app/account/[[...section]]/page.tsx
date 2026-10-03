import { notFound } from "next/navigation";
import { catalogue } from "@/lib/catalogue";
import PageFrame from "@/components/site/PageFrame";
import AccountPanel from "@/components/site/AccountPanel";
export const dynamic = "force-dynamic";
export default async function AccountPage({params}:{params:Promise<{section?:string[]}>}) {
  const {section} = await params; const tab=section?.[0] || "profile"; if((section?.length ?? 0)>1 || !["profile","tickets","saved"].includes(tab)) notFound();const {events}=await catalogue();
  return <PageFrame><main id="main" className="wrap page-content"><p className="eyebrow">YOUR EASY TICKETS</p><h1>A little more to look forward to.</h1><AccountPanel key={tab} section={tab} events={events}/></main></PageFrame>;
}
