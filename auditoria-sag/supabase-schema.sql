-- ══ AUDITORÍA DE BIOSEGURIDAD SAG — tabla de resultados ═══════════
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor (mismo proyecto
-- xewujmpycclqjhlmiica que usan registro-productivo-avicola y ventas).
--
-- Tabla de solo-inserción pública: cualquier visitante de avivet.cl
-- puede registrar una auditoría (sin login), pero nadie puede leer los
-- datos de otro establecimiento con la llave pública. Los resultados
-- solo son visibles desde el Table Editor de Supabase (dueño del
-- proyecto) o desde la Edge Function de alerta (service_role).

create table if not exists auditorias_bioseguridad (
  id               uuid primary key,
  created_at       timestamptz default now(),
  establecimiento  text not null,
  responsable      text,
  email            text,
  telefono         text,
  rubro            text not null check (rubro in ('engorda','ponedora_a','ponedora_b')),
  fecha_auditoria  date,
  respuestas       jsonb not null default '{}',
  puntaje_global   numeric,
  puntajes_seccion jsonb,
  items_cumple     integer,
  items_no_cumple  integer,
  items_na         integer
);

alter table auditorias_bioseguridad enable row level security;

do $$
begin
  -- Inserción y actualización pública (anon): permite guardar la auditoría
  -- y volver a guardarla si el productor sigue respondiendo ítems después
  -- del primer guardado (mismo id, generado en el navegador).
  if not exists (select 1 from pg_policies where tablename='auditorias_bioseguridad' and policyname='auditorias_bioseguridad_insert_anon') then
    execute 'create policy "auditorias_bioseguridad_insert_anon" on auditorias_bioseguridad for insert to anon, authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='auditorias_bioseguridad' and policyname='auditorias_bioseguridad_update_anon') then
    execute 'create policy "auditorias_bioseguridad_update_anon" on auditorias_bioseguridad for update to anon, authenticated using (true) with check (true)';
  end if;
end $$;

-- Sin política de SELECT para anon/authenticated a propósito: así cada
-- productor puede enviar y actualizar su propia auditoría pero no leer
-- las de los demás. Tú la revisas desde Table Editor → auditorias_bioseguridad.
