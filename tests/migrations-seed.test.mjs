import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {siteEvents} from './helpers/site-events.mjs';
test('all ordered migrations and seed apply to a fresh database with Supabase platform prerequisites',async()=>{
 const db=new PGlite();
 try {
  await db.exec(await readFile(new URL('./fixtures/supabase-platform.sql',import.meta.url),'utf8'));
  const dir=new URL('../supabase/migrations/',import.meta.url);
  const files=(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files) await db.exec(await readFile(new URL(file,dir),'utf8'));
  const seed=await readFile(new URL('../supabase/seed.sql',import.meta.url),'utf8');
  await db.exec(seed); await db.exec(seed);
  const expected=await siteEvents();
  const actual=await db.query('select id,payload,starts_at from website_events order by id');
  assert.equal(actual.rows.length,6);
  for(let i=0;i<expected.length;i++) {
   const seeded=structuredClone(actual.rows[i].payload);
   assert.equal(seeded.tiers.length,3);
   for(const tier of seeded.tiers) {assert.equal(tier.capacity,0);delete tier.capacity;}
   assert.deepEqual(seeded,expected[i]);
   assert.equal(new Date(actual.rows[i].starts_at).toISOString(),new Date(expected[i].startsAt.replaceAll('/','-').replace(' ','T')+':00+02:00').toISOString());
  }
  const buckets=await db.query('select * from storage.buckets');
  assert.equal(buckets.rows[0].id,'website-event-images');
  assert.equal(buckets.rows[0].file_size_limit,8388608);
  await db.exec('set role service_role');
  const catalogue=await db.query('select * from website_catalogue()');
  assert.equal(catalogue.rows.length,expected.filter(e=>Date.parse(e.startsAt.replaceAll('/','-').replace(' ','T')+':00+02:00')>Date.now()).length);
  assert.equal(catalogue.rows.every(r=>r.payload.tiers.every(t=>t.available===0)),true);
  await db.exec('reset role');
  const sequences=await db.query("select nextval('website_events_id_seq') as id");
  assert.ok(Number(sequences.rows[0].id)>=1000);
 } finally {await db.close();}
});
