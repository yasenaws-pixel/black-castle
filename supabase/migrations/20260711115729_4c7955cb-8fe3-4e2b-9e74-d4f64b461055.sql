create table public.chat_sessions (
  session_id text primary key,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
grant all on public.chat_sessions to service_role;
alter table public.chat_sessions enable row level security;