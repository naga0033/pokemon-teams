alter table public.teams
add column if not exists view_count integer not null default 0;
