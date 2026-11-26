create extension if not exists pgcrypto;

create table if not exists public.home_accounts (
  messages_user_id text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_systems (
  id uuid primary key default gen_random_uuid(),
  owner_messages_user_id text not null
    references public.home_accounts(messages_user_id) on delete cascade,
  system_name text not null,
  system_origin text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  locked boolean not null default false,
  lock_password_salt text,
  lock_password_hash text,
  detailed_logging boolean not null default false,
  unique (owner_messages_user_id, system_origin),
  unique (id, owner_messages_user_id)
);

create table if not exists public.home_system_sessions (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  messages_user_id text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint home_session_system_owner_fk
    foreign key (system_id, messages_user_id)
    references public.home_systems(id, owner_messages_user_id) on delete cascade
);

create table if not exists public.home_events (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  messages_user_id text not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint home_event_system_owner_fk
    foreign key (system_id, messages_user_id)
    references public.home_systems(id, owner_messages_user_id) on delete cascade
);

create index if not exists home_sessions_expiry_idx on public.home_system_sessions(expires_at);
create index if not exists home_sessions_system_idx on public.home_system_sessions(system_id);
create index if not exists home_events_system_created_idx on public.home_events(system_id, created_at desc);
create index if not exists home_events_user_created_idx on public.home_events(messages_user_id, created_at desc);

alter table public.home_accounts enable row level security;
alter table public.home_systems enable row level security;
alter table public.home_system_sessions enable row level security;
alter table public.home_events enable row level security;

revoke all on public.home_accounts from anon, authenticated;
revoke all on public.home_systems from anon, authenticated;
revoke all on public.home_system_sessions from anon, authenticated;
revoke all on public.home_events from anon, authenticated;

grant all on public.home_accounts to service_role;
grant all on public.home_systems to service_role;
grant all on public.home_system_sessions to service_role;
grant all on public.home_events to service_role;

create table if not exists public.home_system_lock_messages (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references public.home_systems(id) on delete cascade,
  owner_messages_user_id text not null,
  action text not null check (action in ('lock','unlock')),
  created_at timestamptz not null default now()
);
create index if not exists home_system_lock_messages_system_created_idx
  on public.home_system_lock_messages (system_id, created_at desc);

create table if not exists public.home_system_lock_attempts (
  id bigint generated always as identity primary key,
  system_id uuid not null references public.home_systems(id) on delete cascade,
  ip_hash text not null,
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists home_system_lock_attempts_lookup_idx
  on public.home_system_lock_attempts (system_id, ip_hash, attempted_at desc);

alter table public.home_system_lock_messages enable row level security;
alter table public.home_system_lock_attempts enable row level security;
revoke all on public.home_system_lock_messages from anon, authenticated;
revoke all on public.home_system_lock_attempts from anon, authenticated;
grant all on public.home_system_lock_messages to service_role;
grant all on public.home_system_lock_attempts to service_role;

create table if not exists public.home_system_lock_contexts (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  messages_user_id text not null,
  ticket_hash text not null unique,
  expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint home_system_lock_contexts_system_owner_fk
    foreign key (system_id, messages_user_id)
    references public.home_systems (id, owner_messages_user_id)
    on delete cascade
);
create index if not exists home_system_lock_contexts_expiry_idx
  on public.home_system_lock_contexts (expires_at);
alter table public.home_system_lock_contexts enable row level security;
revoke all on public.home_system_lock_contexts from anon, authenticated;
grant all on public.home_system_lock_contexts to service_role;
