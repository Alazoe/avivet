-- ══ PESAJE POLLITAS — Supabase Schema ══════════════════════════

create table lotes (
  id         text primary key,          -- 'L01', 'L02', …
  nombre     text        not null,
  fecha_nac  date        not null,
  n_aves     integer     default 0,
  activo     boolean     default true,
  user_id    uuid        references auth.users not null,
  created_at timestamptz default now()
);

create table pesajes (
  id           uuid        default gen_random_uuid() primary key,
  lote_id      text        not null,
  semana       integer     not null,
  fecha        date,
  n_aves       integer,
  promedio_kg  numeric(6,3),
  cv_pct       numeric(8,4),
  uniformidad  numeric(8,4),
  rango_min    numeric(6,3),
  rango_max    numeric(6,3),
  fuera_rango  integer,
  metodo       text        default 'manual',
  pesos_raw    text,
  user_id      uuid        references auth.users not null,
  created_at   timestamptz default now()
);

-- Row Level Security: cada usuario ve solo sus datos
alter table lotes   enable row level security;
alter table pesajes enable row level security;

create policy "lotes_user"   on lotes   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pesajes_user" on pesajes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
