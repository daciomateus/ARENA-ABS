create table if not exists public.reservas (
  id text primary key,
  customer_name text not null,
  phone text not null,
  court text not null,
  hour integer not null,
  price numeric(10,2) not null,
  datetime timestamptz not null,
  cancel_token text,
  created_at timestamptz not null default now()
);

alter table public.reservas add column if not exists cancel_token text;
create index if not exists reservas_cancel_token_idx on public.reservas (cancel_token);

alter table public.reservas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reservas' and policyname = 'Public can read reservas'
  ) then
    create policy "Public can read reservas"
    on public.reservas
    for select
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reservas' and policyname = 'Public can insert reservas'
  ) then
    create policy "Public can insert reservas"
    on public.reservas
    for insert
    with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reservas' and policyname = 'Public can delete reservas'
  ) then
    create policy "Public can delete reservas"
    on public.reservas
    for delete
    using (true);
  end if;
end
$$;
