-- ══ REGISTRO DE NECROPSIAS — tablas y almacenamiento privado ══════
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor (mismo proyecto
-- xewujmpycclqjhlmiica que registro-productivo-avicola y auditoria-sag).
--
-- Herramienta PRIVADA: requiere iniciar sesión. Cada fila y cada foto
-- pertenecen a quien la creó (auth.uid()); nadie más puede leerlas,
-- ni siquiera otro usuario autenticado del mismo proyecto (productores).
-- Las fotos viven en un bucket privado y se muestran con URLs firmadas
-- que caducan en 1 hora.

-- ── Necropsias ───────────────────────────────────────────────────
create table if not exists necropsias (
  id               uuid primary key,
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  fecha            date not null,
  productor        text not null,
  lote             text,
  tipo_ave         text,
  linea_genetica   text,
  edad_semanas     numeric,
  n_aves           integer,
  historia         jsonb not null default '{}',  -- motivo, mortalidad, signos, vacunación…
  hallazgos        jsonb not null default '{}',  -- por sistema: estado, chips, notas, score
  fotos            jsonb not null default '[]',  -- [{path, sistema, nota}]
  dx_presuntivo    text,
  diferenciales    text,
  muestras         jsonb not null default '[]',
  laboratorio      text,
  recomendaciones  text
);

create index if not exists necropsias_user_fecha on necropsias (user_id, fecha desc);

alter table necropsias enable row level security;

-- ── Biblioteca de imágenes de referencia ─────────────────────────
create table if not exists necropsia_referencias (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  path         text not null,           -- ruta en el bucket `necropsias`
  sistema      text not null,
  estado       text not null default 'referencia' check (estado in ('normal','alterado','referencia')),
  titulo       text not null,
  descripcion  text,
  fuente       text
);

alter table necropsia_referencias enable row level security;

do $$
declare t text;
begin
  foreach t in array array['necropsias','necropsia_referencias'] loop
    if not exists (select 1 from pg_policies where tablename=t and policyname=t||'_propias') then
      execute format(
        'create policy %I on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
        t||'_propias', t);
    end if;
  end loop;
end $$;

-- ── Bucket privado de fotos ──────────────────────────────────────
-- Estructura: {user_id}/{necropsia_id}/{archivo}.jpg  y  {user_id}/referencias/{archivo}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('necropsias', 'necropsias', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='necropsias_fotos_propias') then
    execute $p$
      create policy "necropsias_fotos_propias" on storage.objects for all to authenticated
      using (bucket_id = 'necropsias' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'necropsias' and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
  end if;
end $$;
