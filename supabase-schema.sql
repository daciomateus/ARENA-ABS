create table if not exists public.alunos (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  email text not null unique,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  referencia text not null,
  valor numeric(10,2) not null,
  vencimento date not null,
  status_pagamento text not null default 'pendente',
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.alunos enable row level security;
alter table public.mensalidades enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Aluno pode ver proprio cadastro'
  ) then
    create policy "Aluno pode ver proprio cadastro"
    on public.alunos for select using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Aluno pode atualizar proprio cadastro'
  ) then
    create policy "Aluno pode atualizar proprio cadastro"
    on public.alunos for update using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Public can upsert alunos'
  ) then
    create policy "Public can upsert alunos"
    on public.alunos for insert with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Aluno pode ver proprias mensalidades'
  ) then
    create policy "Aluno pode ver proprias mensalidades"
    on public.mensalidades for select using (auth.uid() = aluno_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Public can manage mensalidades'
  ) then
    create policy "Public can manage mensalidades"
    on public.mensalidades for insert with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Public can update mensalidades'
  ) then
    create policy "Public can update mensalidades"
    on public.mensalidades for update using (true);
  end if;
end
$$;
