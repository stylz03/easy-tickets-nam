import "server-only";
import { accountIdentity } from "./account-api";
import { supabaseAdmin } from "./supabase-admin";
export async function organiserIdentity(){
 const identity=await accountIdentity();if(!identity)return null;
 const {data,error}=await identity.client.from("website_organiser_members").select("organisation_id,role,website_organisations(id,name)").eq("user_id",identity.user.id).in("role",["owner","manager"]);
 if(error)throw new Error("Organiser services are unavailable.");
 return {...identity,members:data ?? []};
}
export async function ownedEvent(id:number,userId:string){
 const {data:event,error}=await supabaseAdmin().from("website_events").select("*").eq("id",id).maybeSingle();
 if(error||!event)return null;
 const {data:member}=await supabaseAdmin().from("website_organiser_members").select("role").eq("organisation_id",event.organisation_id).eq("user_id",userId).in("role",["owner","manager"]).maybeSingle();
 return member?event:null;
}
