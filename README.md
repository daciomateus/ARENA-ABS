# Arena ABS App

Sistema web para aluguel de quadras, matriculas e controle administrativo da Arena ABS.

## O que o sistema entrega hoje
- login e cadastro com Supabase Auth
- reserva de quadras com bloqueio de conflito por horario e quadra
- checkout antes do envio para WhatsApp
- matricula em planos mensais
- painel admin com reservas por dia
- controle de alunos matriculados com busca por nome
- registro manual de pagamento com calculo automatico do proximo vencimento
- visualizacao separada para admin e usuario comum

## Requisitos
- Node.js instalado
- projeto Supabase configurado
- arquivo `.env` preenchido

## Variaveis de ambiente
Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Rodando localmente
No `cmd` ou PowerShell:

```powershell
cd "C:\Users\user\OneDrive\Desktop\teste\aluguel de quadras\arena-abs-app"
npm.cmd install
npm.cmd run dev -- --open
```

Se nao quiser abrir automatico no navegador:

```powershell
npm.cmd run dev
```

## Build de producao
```powershell
npm.cmd run build
npm.cmd run lint
```

## Publicacao online na Vercel
1. Suba a pasta `arena-abs-app` para um repositorio no GitHub.
2. Entre em [Vercel](https://vercel.com/).
3. Clique em `Add New Project`.
4. Importe o repositorio do app.
5. Adicione as variaveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Publique o projeto.
7. No Supabase, acesse `Authentication > URL Configuration` e adicione:
   - a URL publica da Vercel em `Site URL`
   - a URL publica com `/*` em `Redirect URLs`

Este projeto ja inclui `vercel.json` para que as rotas do React Router funcionem corretamente em producao.

## Automacao de vencimento por e-mail
O projeto agora inclui uma Edge Function pronta em [supabase/functions/send-due-reminders/index.ts](/C:/Users/user/OneDrive/Desktop/teste/aluguel%20de%20quadras/arena-abs-app/supabase/functions/send-due-reminders/index.ts) e a migracao [supabase/migrations/20260413_add_email_reminder_columns.sql](/C:/Users/user/OneDrive/Desktop/teste/aluguel%20de%20quadras/arena-abs-app/supabase/migrations/20260413_add_email_reminder_columns.sql).

Secrets necessarios no Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_NOTIFICATION_EMAIL`

Fluxo esperado:
1. aplicar a migracao no banco
2. publicar a Edge Function
3. cadastrar os secrets
4. agendar uma execucao diaria

## Supabase: pontos importantes
- Auth por e-mail habilitado
- tabela `profiles`
- tabela `reservas`
- tabela `matriculas`
- tabela `financeiro_alunos`
- policies RLS configuradas para aluno ver apenas os proprios dados e admin ver tudo

## Fluxos principais para demonstracao comercial
### Usuario comum
- cria conta ou faz login
- reserva horarios
- passa pelo checkout
- envia a reserva para WhatsApp
- envia matricula
- acompanha reservas e status financeiro

### Admin
- visualiza reservas por dia
- cancela reservas
- acompanha alunos matriculados
- pesquisa aluno por nome
- registra pagamento manual
- acompanha quem esta em dia e quem esta vencido

## Proximo passo recomendado
- configurar o agendamento diario da Edge Function no ambiente de producao
