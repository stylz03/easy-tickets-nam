import { organiserIdentity } from "@/lib/organiser-api";
import { json } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "node:crypto";
export async function POST(req:Request){
 if(req.headers.get("origin")!==new URL(req.url).origin)return json({error:"Invalid request."},403);
 if(Number(req.headers.get("content-length"))>9*1024*1024)return json({error:"Use an image smaller than 8 MB."},413);
 try{const identity=await organiserIdentity();if(!identity)return json({error:"Please sign in."},401);
 const fd=await req.formData();const org=String(fd.get("organisationId")||"");if(!identity.members.some(m=>m.organisation_id===org))return json({error:"Organiser access required."},403);
 const file=fd.get("file");if(!(file instanceof File)||!file.size||file.size>8*1024*1024)return json({error:"Choose an image smaller than 8 MB."},400);
 const bytes=Buffer.from(await file.arrayBuffer());let ext="";
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext="png";
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext="jpg";
 else if(bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP")ext="webp";
 if(!ext)return json({error:"Use a PNG, JPEG or WebP image."},400);
 const path=org+"/"+randomUUID()+"."+ext;const client=supabaseAdmin();const {error}=await client.storage.from("website-event-images").upload(path,bytes,{contentType:ext==="jpg"?"image/jpeg":"image/"+ext,upsert:false});
 if(error)return json({error:"Could not upload the image."},503);
 return json({url:client.storage.from("website-event-images").getPublicUrl(path).data.publicUrl});
 }catch{return json({error:"Image upload is unavailable."},503);}
}
