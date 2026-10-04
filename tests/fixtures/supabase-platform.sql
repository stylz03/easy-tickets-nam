-- LOCAL TEST ONLY. Never apply to a Supabase project.
-- Supabase provides these platform roles/schemas before application migrations.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to anon,authenticated,service_role;
create schema storage;
create table storage.buckets(
 id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]
);
