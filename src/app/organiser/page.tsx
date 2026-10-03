import PageFrame from "@/components/site/PageFrame";
import OrganiserPanel from "@/components/site/OrganiserPanel";
export default async function OrganiserPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const p=await searchParams;const edit=typeof p.edit==="string"?p.edit:"";const tab=typeof p.tab==="string"&&["overview","events","sales","staff"].includes(p.tab)?p.tab:"overview";return <PageFrame><main id="main" className="wrap page-content"><OrganiserPanel key={edit+tab} edit={edit} tab={tab}/></main></PageFrame>;}
