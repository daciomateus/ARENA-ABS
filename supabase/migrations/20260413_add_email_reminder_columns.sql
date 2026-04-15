alter table public.financeiro_alunos
  add column if not exists ultimo_aviso_7_dias_em date,
  add column if not exists ultimo_aviso_vencimento_em date,
  add column if not exists ultimo_aviso_atraso_em date;

create index if not exists financeiro_alunos_proximo_vencimento_idx
  on public.financeiro_alunos (proximo_vencimento);
