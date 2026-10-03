import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import zxing from '@zxing/library';
const { QRCodeReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } = zxing;
const db = new PGlite();
const owner=randomUUID(), stranger=randomUUID(), scanner=randomUUID(), org=randomUUID();
let eventId,orderId,ticket;
const start=new Date(Date.now()+7*86400000).toISOString().slice(0,16).replaceAll('-','/').replace('T',' ');
const payload={title:'Test concert',startsAt:start,description:'A private integration test event.',location:'Test venue, Windhoek',category:'Music',img:'/images/design1/evt1.png',price:100,tiers:[{id:'standard',name:'General admission',price:100,capacity:1,perks:['Entry']},{id:'premium',name:'Premium',price:150,capacity:0,perks:[]},{id:'vip',name:'VIP',price:200,capacity:0,perks:[]}]};
async function as(role,user,fn){await db.exec('SET ROLE '+role);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);try{return await fn();}finally{await db.exec('RESET ROLE');await db.query("select set_config('request.jwt.claim.sub','',false)");}}
const order=(ref,price=100)=>({ref,user_id:owner,event_id:eventId,event_name:'Test concert',items:[{tier:'standard',name:'General admission',qty:1,unit_price:price}],amount:String(price),currency:'NAD',buyer_name:'Test Buyer',buyer_email:'buyer@example.test',buyer_phone:'+264000000000'});
before(async()=>{
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
 await db.exec(await readFile(new URL('../supabase/migrations/20261003110000_orders.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/20261003160000_website_platform.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())',[owner,'owner@example.test',stranger,'stranger@example.test',scanner,'scanner@example.test']);
 await db.query('insert into website_organisations(id,name) values($1,$2)',[org,'Test organiser']);
 await db.query('insert into website_organiser_members values($1,$2,$3)',[org,owner,'owner']);
 const result=await as('authenticated',owner,()=>db.query('select save_website_event(null,$1,$2,true) as id',[org,payload]));eventId=result.rows[0].id;
});
after(async()=>{await db.close();});
test('only trusted organiser members can create events or grant themselves access',async()=>{
 await assert.rejects(as('authenticated',stranger,()=>db.query('select save_website_event(null,$1,$2,true)',[org,payload])),/Organiser access required/);
 await assert.rejects(as('authenticated',stranger,()=>db.query("insert into website_organiser_members values($1,$2,'owner')",[org,stranger])),/permission denied/);
 const rows=await as('authenticated',stranger,()=>db.query('select * from website_organiser_members'));assert.equal(rows.rows.length,0);
});
test('account profiles stay private and cannot be edited by another buyer',async()=>{
 await as('authenticated',owner,()=>db.query('insert into website_profiles(user_id,full_name) values($1,$2)',[owner,'Test Buyer']));
 const rows=await as('authenticated',stranger,()=>db.query('select * from website_profiles'));assert.equal(rows.rows.length,0);
 await assert.rejects(as('authenticated',stranger,()=>db.query('insert into website_profiles(user_id,full_name) values($1,$2)',[owner,'Intruder'])),/row-level security/);
});
test('database checks prices and prevents selling beyond event capacity',async()=>{
 await assert.rejects(as('service_role',null,()=>db.query('select (reserve_website_order($1)).id',[order('ET-20261003-A0000001',99)])),/prices changed/);
 const result=await as('service_role',null,()=>db.query('select (reserve_website_order($1)).id',[order('ET-20261003-A0000002')]));orderId=result.rows[0].id;
 await assert.rejects(as('service_role',null,()=>db.query('select (reserve_website_order($1)).id',[order('ET-20261003-A0000003')])),/Not enough tickets/);
 const reduced={...payload,tiers:payload.tiers.map(t=>({...t,capacity:0}))};
 await assert.rejects(as('authenticated',owner,()=>db.query('select save_website_event($1,$2,$3,true)',[eventId,org,reduced])),/capacity/);
});
test('only paid orders issue tickets and repeated confirmation does not duplicate them',async()=>{
 let rows=await db.query('select * from website_tickets where order_id=$1',[orderId]);assert.equal(rows.rows.length,0);
 await db.query("update orders set status='paid' where id=$1",[orderId]);
 await db.query("update orders set status='paid' where id=$1",[orderId]);
 rows=await db.query('select * from website_tickets where order_id=$1',[orderId]);assert.equal(rows.rows.length,1);ticket=rows.rows[0];
 assert.equal(ticket.secret.length,64);
 const visible=await as('authenticated',owner,()=>db.query('select * from website_tickets')).catch(e=>e);assert.match(String(visible),/permission denied/);
});
test('a generated QR code decodes back to the genuine ticket credential',async()=>{
 const credential='ET1.'+ticket.id+'.'+ticket.secret;
 const png=PNG.sync.read(await QRCode.toBuffer(credential,{width:480,margin:4,errorCorrectionLevel:'M'}));
 const gray=new Uint8ClampedArray(png.width*png.height);for(let i=0;i<gray.length;i++)gray[i]=png.data[i*4];
 const decoded=new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(gray,png.width,png.height)))).getText();assert.equal(decoded,credential);
});
test('only assigned staff admit a ticket, and a second scan is rejected',async()=>{
 await as('authenticated',owner,()=>db.query('select assign_website_event_staff($1,$2)',[eventId,'scanner@example.test']));
 await assert.rejects(as('authenticated',stranger,()=>db.query('select check_in_website_ticket($1,$2,$3)',[ticket.id,ticket.secret,eventId])),/Staff assignment/);
 const wrong=await as('authenticated',scanner,()=>db.query('select check_in_website_ticket($1,$2,$3) as result',[ticket.id,'0'.repeat(64),eventId]));assert.equal(wrong.rows[0].result.ok,false);
 const first=await as('authenticated',scanner,()=>db.query('select check_in_website_ticket($1,$2,$3) as result',[ticket.id,ticket.secret,eventId]));assert.equal(first.rows[0].result.ok,true);
 const second=await as('authenticated',scanner,()=>db.query('select check_in_website_ticket($1,$2,$3) as result',[ticket.id,ticket.secret,eventId]));assert.equal(second.rows[0].result.ok,false);assert.match(second.rows[0].result.error,/already been used/);
});

test('catalogue exposes remaining capacity without buyer details and rejects malformed tiers',async()=>{
 const result=await as('service_role',null,()=>db.query('select * from website_catalogue()'));
 const entry=result.rows.find(row=>row.payload.id===eventId).payload;
 assert.equal(entry.tiers.find(t=>t.id==='standard').available,0);
 assert.equal(JSON.stringify(entry).includes('buyer@example.test'),false);
 const malformed={...payload,tiers:payload.tiers.map((t,i)=>i===0?{...t,price:null}:t)};
 await assert.rejects(as('authenticated',owner,()=>db.query('select save_website_event($1,$2,$3,true)',[eventId,org,malformed])),/Invalid price/);
});
