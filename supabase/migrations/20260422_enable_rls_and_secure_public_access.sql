create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and tipo_usuario = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_admin() from anon;
revoke all on function private.is_admin() from authenticated;

alter table public.profiles enable row level security;
alter table public.reservas enable row level security;
alter table public.matriculas enable row level security;
alter table public.financeiro_alunos enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_insert_own_or_admin on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists reservas_select_own_or_admin on public.reservas;
drop policy if exists reservas_insert_own_or_admin on public.reservas;
drop policy if exists reservas_update_own_or_admin on public.reservas;
drop policy if exists matriculas_select_own_or_admin on public.matriculas;
drop policy if exists matriculas_insert_own_or_admin on public.matriculas;
drop policy if exists financeiro_select_own_or_admin on public.financeiro_alunos;
drop policy if exists financeiro_insert_admin_only on public.financeiro_alunos;
drop policy if exists financeiro_update_admin_only on public.financeiro_alunos;

create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
);

create policy profiles_insert_own_or_admin
on public.profiles
for insert
to authenticated
with check (
  (
    (select auth.uid()) = id
    and coalesce(tipo_usuario, 'usuario') = 'usuario'
  )
  or private.is_admin()
);

create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
)
with check (
  (
    (select auth.uid()) = id
    and coalesce(tipo_usuario, 'usuario') = 'usuario'
  )
  or private.is_admin()
);

create policy reservas_select_own_or_admin
on public.reservas
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or private.is_admin()
);

create policy reservas_insert_own_or_admin
on public.reservas
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  or private.is_admin()
);

create policy reservas_update_own_or_admin
on public.reservas
for update
to authenticated
using (
  (select auth.uid()) = user_id
  or private.is_admin()
)
with check (
  (select auth.uid()) = user_id
  or private.is_admin()
);

create policy matriculas_select_own_or_admin
on public.matriculas
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or private.is_admin()
);

create policy matriculas_insert_own_or_admin
on public.matriculas
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  or private.is_admin()
);

create policy financeiro_select_own_or_admin
on public.financeiro_alunos
for select
to authenticated
using (
  (select auth.uid()) = aluno_id
  or private.is_admin()
);

create policy financeiro_insert_admin_only
on public.financeiro_alunos
for insert
to authenticated
with check (private.is_admin());

create policy financeiro_update_admin_only
on public.financeiro_alunos
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create or replace function public.list_public_reservations(date_from date default null, date_to date default null)
returns table (
  id uuid,
  quadra text,
  data_reserva date,
  horario text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.quadra,
    r.data_reserva,
    r.horario,
    r.status
  from public.reservas as r
  where (date_from is null or r.data_reserva >= date_from)
    and (date_to is null or r.data_reserva <= date_to);
$$;

create or replace function public.is_reservation_slot_taken(p_quadra text, p_data_reserva date, p_horario text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reservas as r
    where r.quadra = p_quadra
      and r.data_reserva = p_data_reserva
      and r.horario = p_horario
      and coalesce(r.status, '') <> 'cancelada'
  );
$$;

revoke all on function public.list_public_reservations(date, date) from public;
revoke all on function public.is_reservation_slot_taken(text, date, text) from public;

grant execute on function public.list_public_reservations(date, date) to anon;
grant execute on function public.list_public_reservations(date, date) to authenticated;
grant execute on function public.is_reservation_slot_taken(text, date, text) to anon;
grant execute on function public.is_reservation_slot_taken(text, date, text) to authenticated;
