import { organiserIdentity } from "@/lib/organiser-api";
import { json } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
export async function GET(){
 try{const identity=await organiserIdentity();if(!identity)return json({error:"Please sign in."},401);
 const organisations=identity.members.map(m=>({id:m.organisation_id,role:m.role,name:(m.website_organisations as unknown as {name:string})?.name || "Your organisation"}));
 if(!organisations.length)return json({organisations:[],events:[],orders:[],staff:[]});
 const eventResult=await supabaseAdmin().from("website_events").select("id,title,published,payload,organisation_id,starts_at").in("organisation_id",organisations.map(o=>o.id)).order("starts_at");
 if(eventResult.error)throw new Error();const events=eventResult.data ?? [];const ids=events.map(e=>e.id);
 const [orderResult,staffResult]=ids.length?await Promise.all([supabaseAdmin().from("orders").select("id,ref,event_id,event_name,buyer_name,buyer_email,items,amount,status,created_at").in("event_id",ids).order("created_at",{ascending:false}).limit(1000),supabaseAdmin().from("website_event_staff").select("event_id,user_id").in("event_id",ids)]):[{data:[],error:null},{data:[],error:null}];
 if(orderResult.error||staffResult.error)throw new Error();
 return json({organisations,events,orders:orderResult.data ?? [],staff:staffResult.data ?? []});
 }catch{return json({error:"Organiser services are not available yet. Please try again later."},503);}
}
