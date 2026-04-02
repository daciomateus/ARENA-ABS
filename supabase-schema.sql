create table if not exists public.reservas (
  id text primary key,
  customer_name text not null,
  phone text not null,
  court text not null,
  hour integer not null,
  price numeric(10,2) not null,
  datetime timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.reservas enable row level security;

create policy "Public can read reservas"
on public.reservas
for select
using (true);

create policy "Public can insert reservas"
on public.reservas
for insert
with check (true);

create policy "Public can delete reservas"
on public.reservas
for delete
using (true);
