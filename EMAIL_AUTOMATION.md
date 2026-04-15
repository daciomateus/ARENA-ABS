# Automacao de avisos por e-mail

## Objetivo
Avisar automaticamente:
- o aluno quando a mensalidade estiver para vencer
- o admin quando houver alunos proximos do vencimento ou vencidos

## Regra sugerida
- 7 dias antes do vencimento: enviar aviso ao aluno e ao admin
- no dia do vencimento: enviar novo aviso
- 1 dia apos vencer: enviar aviso de atraso

## Base de dados usada
Tabela: `financeiro_alunos`
Campos importantes:
- `aluno_id`
- `data_ultimo_pagamento`
- `proximo_vencimento`
- `status`
- `ultimo_aviso_7_dias_em`
- `ultimo_aviso_vencimento_em`

## Arquitetura recomendada
1. Supabase Edge Function diaria
2. consulta em `financeiro_alunos`
3. envio de e-mail por servico externo

## Servicos de e-mail recomendados
- Resend
- Brevo
- SendGrid

## Fluxo tecnico
1. a rotina diaria busca registros com vencimento em 7 dias
2. ignora quem ja recebeu aviso recentemente
3. envia e-mail ao aluno
4. envia resumo ao admin
5. grava a data do ultimo aviso

## Implementacao criada no projeto
- Edge Function: `supabase/functions/send-due-reminders/index.ts`
- Migracao: `supabase/migrations/20260413_add_email_reminder_columns.sql`
- Provedor configurado no codigo: Resend

## Secrets necessarios no Supabase
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_NOTIFICATION_EMAIL`

## Deploy sugerido
```powershell
supabase functions deploy send-due-reminders
supabase secrets set RESEND_API_KEY=... EMAIL_FROM=... ADMIN_NOTIFICATION_EMAIL=...
```

Depois, agende a chamada diaria da funcao pelo cron do Supabase ou por um agendador externo.

## Resultado esperado
- o sistema nao depende do aluno entrar no site
- o admin ganha previsibilidade
- a Arena passa a ter controle financeiro mais profissional
