import { organiserIdentity } from "@/lib/organiser-api";
import { json,sameOrigin } from "@/lib/account-api";
import type { EventItem,TierId } from "@/data/events";
const text=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:"Invalid request."},403);
 try{const identity=await organiserIdentity();if(!identity)return json({error:"Please sign in."},401);
 const b=await req.json().catch(()=>null);if(!b||!identity.members.some(m=>m.organisation_id===b.organisationId))return json({error:"You do not manage that organisation."},403);
 const title=text(b.title,120),venue=text(b.venue,160),city=text(b.city,60),description=text(b.description,5000),image=text(b.image,1000);
 const start=typeof b.start==="string"?b.start:"";const end=typeof b.end==="string"?b.end:"";
 if(title.length<3||venue.length<3||!city||description.length<20||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(end)||Date.parse(start+":00+02:00")<=Date.now()||Date.parse(end+":00+02:00")<=Date.parse(start+":00+02:00"))return json({error:"Check your event details and future start/end times."},400);
 if(!["Music","Culture","Sport","Food","Entertainment"].includes(b.category))return json({error:"Choose an event category."},400);
 const allowedOrigin=process.env.SUPABASE_URL?new URL(process.env.SUPABASE_URL).origin:"";
 if(!image.startsWith("/images/")&&!image.startsWith(allowedOrigin+"/storage/v1/object/public/website-event-images/"))return json({error:"Upload event artwork first."},400);
 if(!Array.isArray(b.tiers)||b.tiers.length!==3)return json({error:"Set up the three ticket types."},400);
 const ids:TierId[]=["standard","premium","vip"];
 const tiers=b.tiers.map((t:Record<string,unknown>,i:number)=>({id:ids[i],name:text(t.name,60),price:Number(t.price),capacity:Number(t.capacity),perks:[text(t.perks,200)].filter(Boolean)}));
 if(tiers.some((t:{name:string;price:number;capacity:number})=>!t.name||!Number.isSafeInteger(t.price)||t.price<1||t.price>100000||!Number.isSafeInteger(t.capacity)||t.capacity<0||t.capacity>1000000)||tiers.every((t:{capacity:number})=>!t.capacity))return json({error:"Use whole NAD prices and valid ticket capacities."},400);
 const date=new Date(start+":00+02:00");const payload:EventItem={id:Number(b.id)||0,title,description,img:image,location:venue+", "+city,category:b.category,date:date.toLocaleDateString("en-GB",{timeZone:"Africa/Windhoek",month:"short",day:"2-digit"}).toUpperCase(),fullDate:date.toLocaleDateString("en-GB",{timeZone:"Africa/Windhoek",month:"long",day:"numeric",year:"numeric"}),startsAt:start.replaceAll("-","/").replace("T"," "),endsAt:end,time:start.slice(11)+" – "+end.slice(11),price:Math.min(...tiers.filter((t:{capacity:number})=>t.capacity>0).map((t:{price:number})=>t.price)),tiers};
 const {data,error}=await identity.client.rpc("save_website_event",{p_event_id:Number(b.id)||null,p_organisation_id:b.organisationId,p_payload:payload,p_published:b.published===true});
 if(error)return json({error:error.message.includes("capacity")?"Capacity cannot be lower than tickets already sold or reserved.":"Could not save this event. Check your permissions and event details."},400);
 return json({ok:true,id:data});
 }catch{return json({error:"Event services are unavailable."},503);}
}
