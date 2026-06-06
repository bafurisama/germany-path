-- Germany Path — Supabase Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USER PROFILES ──────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,

  -- Onboarding fields
  nationality text,
  visa_type text,
  city text,
  marital_status text,
  arrival_date date,
  employment_status text,
  german_level text default 'none',

  -- Status checks from onboarding
  has_anmeldung boolean default false,
  has_health_insurance boolean default false,
  has_tax_id boolean default false,
  has_bank_account boolean default false,
  has_residence_permit boolean default false,
  has_social_security_number boolean default false,

  -- Meta
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table user_profiles enable row level security;

create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- ─── USER NODE STATES ────────────────────────────────────────────────────────
create table if not exists user_node_states (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  node_id text not null,
  status text not null check (status in ('locked', 'available', 'in_progress', 'completed', 'skipped')),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, node_id)
);

-- RLS
alter table user_node_states enable row level security;

create policy "Users can view their own node states"
  on user_node_states for select
  using (auth.uid() = user_id);

create policy "Users can insert their own node states"
  on user_node_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own node states"
  on user_node_states for update
  using (auth.uid() = user_id);

create policy "Users can delete their own node states"
  on user_node_states for delete
  using (auth.uid() = user_id);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists user_node_states_user_id_idx on user_node_states(user_id);
create index if not exists user_node_states_node_id_idx on user_node_states(node_id);

-- ─── AUTO UPDATE TIMESTAMPS ──────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_user_node_states_updated_at
  before update on user_node_states
  for each row execute function update_updated_at_column();
