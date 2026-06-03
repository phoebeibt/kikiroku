-- Run this in Supabase SQL Editor

create table sake_entries (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users not null,
  name        text not null,
  brewery     text,
  region      text,
  type        text,
  rating      numeric(2,1) check (rating >= 1 and rating <= 5),
  aroma       text,
  taste       text,
  notes       text,
  photo_url   text,
  tasted_at   date default current_date,
  is_public   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security
alter table sake_entries enable row level security;

create policy "Public entries visible to all"
  on sake_entries for select
  using (is_public = true);

create policy "Users see own entries"
  on sake_entries for select
  using (auth.uid() = user_id);

create policy "Users insert own entries"
  on sake_entries for insert
  with check (auth.uid() = user_id);

create policy "Users update own entries"
  on sake_entries for update
  using (auth.uid() = user_id);

create policy "Users delete own entries"
  on sake_entries for delete
  using (auth.uid() = user_id);

-- Storage bucket for photos
-- Run in Supabase Dashboard > Storage > New bucket
-- Name: sake-photos, Public: true
