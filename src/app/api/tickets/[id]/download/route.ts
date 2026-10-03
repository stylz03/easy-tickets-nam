import { toString } from "qrcode";
import { ticketByKey,ticketCredential } from "@/lib/tickets";
function escape(s:string){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");}
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const key=new URL(req.url).searchParams.get("key") || "";
  const t=await ticketByKey(id,key);if(!t)return new Response("Ticket not found",{status:404});
  if(t.status!=="valid")return new Response("This ticket is no longer valid.",{status:409});
  const qr=await toString(ticketCredential(t),{type:"svg",margin:4,errorCorrectionLevel:"M"});
  const qrBody=qr.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  const view=qr.match(/viewBox="([^"]+)"/)?.[1] || "0 0 50 50";
  const date=t.event_date?new Date(t.event_date).toLocaleString("en-GB",{timeZone:"Africa/Windhoek",dateStyle:"medium",timeStyle:"short"}):"";
  const words=t.event_name.split(" ");const lines:string[]=[];let line="";for(const word of words){if((line+" "+word).length>28&&line){lines.push(line);line=word;}else line+=(line?" ":"")+word;}if(line)lines.push(line);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="820" viewBox="0 0 600 820"><rect width="600" height="820" fill="white"/><rect x="20" y="20" width="560" height="780" rx="12" fill="white" stroke="#dce2e8"/><text x="52" y="70" font-family="Arial" font-size="22" font-weight="bold" fill="#172330">Easy Tickets</text><text x="52" y="106" font-family="Arial" font-size="12" fill="#164dcc">${escape(t.tier_name.toUpperCase())} · ONE ADMISSION</text>${lines.slice(0,3).map((l,i)=>`<text x="52" y="${155+i*34}" font-family="Arial" font-size="27" font-weight="bold" fill="#172330">${escape(l)}</text>`).join("")}<text x="52" y="275" font-family="Arial" font-size="16" fill="#65717c">${escape(date)}</text><text x="52" y="310" font-family="Arial" font-size="16" fill="#65717c">${escape(t.holder_name)}</text><svg x="120" y="355" width="360" height="360" viewBox="${view}">${qrBody}</svg><text x="300" y="742" text-anchor="middle" font-family="Arial" font-size="12" fill="#65717c">Ticket ${t.id.slice(0,8).toUpperCase()} · Valid for one entry</text><text x="300" y="771" text-anchor="middle" font-family="Arial" font-size="11" fill="#65717c">Keep this QR code private.</text></svg>`;
  return new Response(svg,{headers:{"Content-Type":"image/svg+xml","Content-Disposition":`attachment; filename="easy-tickets-${id.slice(0,8)}.svg"`,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
}
