import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

test('notification migration applies after the platform schema and keeps delivery data private', async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL('./fixtures/supabase-platform.sql', import.meta.url), 'utf8'));
    const directory = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort())
      await db.exec(await readFile(new URL(file, directory), 'utf8'));
    const userId = randomUUID();
    await db.query('insert into auth.users(id,email) values($1,$2)', [userId, 'checker@example.test']);
    await db.exec('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userId]);
    await db.query('insert into website_notification_preferences(user_id,email_saved) values($1,true)', [userId]);
    const own = await db.query('select email_saved from website_notification_preferences');
    assert.equal(own.rows[0].email_saved, true);
    await assert.rejects(db.query('select * from website_notification_log'), /permission denied/);
    await assert.rejects(db.query('select * from website_push_subscriptions'), /permission denied/);
    await db.exec('reset role');
    const result = await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='orders' and column_name='ticket_email_sent_at'");
    assert.equal(result.rows.length, 1);
  } finally { await db.close(); }
});
