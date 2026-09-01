-- Run once in Supabase > SQL Editor. Every row is protected by its owner id.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  balance numeric not null default 0,
  plan jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.trades (
  id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  market text not null,
  side text not null check (side in ('Long', 'Short')),
  entry numeric,
  exit numeric,
  pnl numeric not null default 0,
  risk numeric,
  setup text not null default '',
  emotion text not null default '',
  notes text not null default '',
  image text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists trades_user_date_idx on public.trades (user_id, trade_date);

alter table public.user_settings enable row level security;
alter table public.trades enable row level security;

drop policy if exists "owners manage settings" on public.user_settings;
create policy "owners manage settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owners manage trades" on public.trades;
create policy "owners manage trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
