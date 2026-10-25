-- ══ AUDITORÍA SAG — migración: rubro Traspatio / AFC + observaciones y fotos ══════
-- Ejecutar UNA SOLA VEZ en Supabase › SQL Editor (proyecto xewujmpycclqjhlmiica),
-- DESPUÉS de supabase-schema.sql. Es idempotente: se puede repetir sin daño.
--
-- Hasta que se ejecute, la app sigue funcionando para Engorda y Ponedoras. Lo nuevo
-- (rubro traspatio y modo «observaciones y fotos») queda pendiente en el dispositivo
-- del usuario y se guarda apenas la migración exista.
--
-- Qué se guarda y dónde:
--   · Datos y observaciones → tabla auditorias_bioseguridad (columnas nuevas, jsonb).
--   · Fotos                 → bucket PRIVADO `auditoria-evidencias`, una carpeta por auditoría:
--                             <id de auditoría>/<id del ítem>-<código>.jpg
--                             La fila guarda solo las rutas (columna `fotos`).
--   · Privacidad            → igual que la tabla: el público puede SUBIR pero no leer ni listar.
--                             Las fotos se ven desde Supabase › Storage (dueño del proyecto).

-- 1) Rubro «traspatio» en la restricción de la tabla
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'auditorias_bioseguridad'::regclass
      and contype = 'c' and pg_get_constraintdef(oid) ilike '%rubro%'
  loop
    execute format('alter table auditorias_bioseguridad drop constraint %I', c);
  end loop;
  alter table auditorias_bioseguridad
    add constraint auditorias_bioseguridad_rubro_check
    check (rubro in ('engorda','ponedora_a','ponedora_b','traspatio'));
end $$;

-- 2) Columnas de evidencias (opcionales: quedan vacías si el modo no se activa)
alter table auditorias_bioseguridad add column if not exists con_evidencias boolean not null default false;
alter table auditorias_bioseguridad add column if not exists observaciones  jsonb   not null default '{}';
alter table auditorias_bioseguridad add column if not exists fotos          jsonb   not null default '{}';

-- 3) Bucket privado para las fotos (solo JPEG, hasta 2 MB cada una; la app las envía de ~150–300 KB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('auditoria-evidencias', 'auditoria-evidencias', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- 4) Solo inserción pública en ese bucket (sin select / update / delete)
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'auditoria_evidencias_insert_anon') then
    execute 'create policy "auditoria_evidencias_insert_anon" on storage.objects
             for insert to anon, authenticated
             with check (bucket_id = ''auditoria-evidencias'')';
  end if;
end $$;
