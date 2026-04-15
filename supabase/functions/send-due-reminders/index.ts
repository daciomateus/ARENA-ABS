import { createClient } from 'jsr:@supabase/supabase-js@2'

type FinanceiroRow = {
  id: string
  aluno_id: string | null
  modalidade: string | null
  valor: number | null
  status: string | null
  data_ultimo_pagamento: string | null
  proximo_vencimento: string | null
  ultimo_aviso_7_dias_em: string | null
  ultimo_aviso_vencimento_em: string | null
  ultimo_aviso_atraso_em: string | null
  created_at?: string | null
}

type ProfileRow = {
  id: string
  nome: string | null
  email: string | null
  telefone?: string | null
}

type ReminderType = '7_days' | 'due_today' | 'overdue_1_day'

type ReminderCandidate = {
  financeiro: FinanceiroRow
  profile: ProfileRow | null
  type: ReminderType
  dueDate: string
  daysUntilDue: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function normalizeDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function parseDateOnly(value: string) {
  return normalizeDate(new Date(`${value}T00:00:00.000Z`))
}

function formatDatePtBr(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(value))
}

function formatCurrency(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Nao informado'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function startOfTodayUtc() {
  return normalizeDate(new Date())
}

function differenceInDays(dueDate: string, today = startOfTodayUtc()) {
  return Math.round((parseDateOnly(dueDate).getTime() - today.getTime()) / DAY_IN_MS)
}

function getReminderType(daysUntilDue: number): ReminderType | null {
  if (daysUntilDue === 7) return '7_days'
  if (daysUntilDue === 0) return 'due_today'
  if (daysUntilDue === -1) return 'overdue_1_day'
  return null
}

function getReminderColumn(type: ReminderType) {
  if (type === '7_days') return 'ultimo_aviso_7_dias_em'
  if (type === 'due_today') return 'ultimo_aviso_vencimento_em'
  return 'ultimo_aviso_atraso_em'
}

function getReminderLabel(type: ReminderType) {
  if (type === '7_days') return 'vence em 7 dias'
  if (type === 'due_today') return 'vence hoje'
  return 'esta vencida desde ontem'
}

function getReminderSubject(type: ReminderType) {
  if (type === '7_days') return 'Arena ABS: sua mensalidade vence em 7 dias'
  if (type === 'due_today') return 'Arena ABS: sua mensalidade vence hoje'
  return 'Arena ABS: sua mensalidade esta em atraso'
}

function getReminderHtml(candidate: ReminderCandidate) {
  const studentName = candidate.profile?.nome || 'Aluno(a)'
  const modalidade = candidate.financeiro.modalidade || 'Plano mensal'
  const dueDate = formatDatePtBr(candidate.dueDate)
  const amount = formatCurrency(candidate.financeiro.valor)
  const label = getReminderLabel(candidate.type)

  return `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5;">
      <h2 style="margin-bottom: 12px;">Arena ABS</h2>
      <p>Oi, ${studentName}.</p>
      <p>Sua mensalidade de <strong>${modalidade}</strong> ${label}.</p>
      <ul>
        <li>Vencimento: <strong>${dueDate}</strong></li>
        <li>Valor: <strong>${amount}</strong></li>
      </ul>
      <p>Se o pagamento ja foi feito, pode desconsiderar este aviso. Se precisar, responda este e-mail para falarmos com voce.</p>
    </div>
  `
}

function getAdminSummaryHtml(candidates: ReminderCandidate[]) {
  const items = candidates.map((candidate) => {
    const studentName = candidate.profile?.nome || 'Aluno sem nome'
    const studentEmail = candidate.profile?.email || 'Sem e-mail'
    const modalidade = candidate.financeiro.modalidade || 'Plano mensal'
    return `<li><strong>${studentName}</strong> (${studentEmail}) - ${modalidade} - ${getReminderLabel(candidate.type)} - vencimento ${formatDatePtBr(candidate.dueDate)}</li>`
  })

  return `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5;">
      <h2 style="margin-bottom: 12px;">Resumo financeiro Arena ABS</h2>
      <p>Foram encontrados <strong>${candidates.length}</strong> avisos para envio nesta execucao.</p>
      <ul>${items.join('')}</ul>
    </div>
  `
}

async function sendEmail({
  resendApiKey,
  from,
  to,
  subject,
  html,
}: {
  resendApiKey: string
  from: string
  to: string
  subject: string
  html: string
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha ao enviar e-mail: ${errorText}`)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM')
    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
    }

    if (!resendApiKey || !emailFrom || !adminEmail) {
      throw new Error('RESEND_API_KEY, EMAIL_FROM e ADMIN_NOTIFICATION_EMAIL sao obrigatorios.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: financeiroRows, error: financeiroError } = await supabase
      .from('financeiro_alunos')
      .select('id, aluno_id, modalidade, valor, status, data_ultimo_pagamento, proximo_vencimento, ultimo_aviso_7_dias_em, ultimo_aviso_vencimento_em, ultimo_aviso_atraso_em, created_at')

    if (financeiroError) throw financeiroError

    const latestFinanceByAluno = new Map<string, FinanceiroRow>()

    for (const row of (financeiroRows ?? []) as FinanceiroRow[]) {
      if (!row.aluno_id || !row.proximo_vencimento) continue

      const current = latestFinanceByAluno.get(row.aluno_id)
      const currentSort = current?.data_ultimo_pagamento || current?.created_at || current?.proximo_vencimento || ''
      const nextSort = row.data_ultimo_pagamento || row.created_at || row.proximo_vencimento || ''

      if (!current || nextSort > currentSort) {
        latestFinanceByAluno.set(row.aluno_id, row)
      }
    }

    const alunoIds = [...latestFinanceByAluno.keys()]
    const profileMap = new Map<string, ProfileRow>()

    if (alunoIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .in('id', alunoIds)

      if (profilesError) throw profilesError

      for (const profile of (profiles ?? []) as ProfileRow[]) {
        profileMap.set(profile.id, profile)
      }
    }

    const today = startOfTodayUtc()
    const todayIso = today.toISOString().slice(0, 10)
    const candidates: ReminderCandidate[] = []

    for (const financeiro of latestFinanceByAluno.values()) {
      if (!financeiro.aluno_id || !financeiro.proximo_vencimento) continue

      const reminderType = getReminderType(differenceInDays(financeiro.proximo_vencimento, today))
      if (!reminderType) continue

      const reminderColumn = getReminderColumn(reminderType)
      const lastSentAt = financeiro[reminderColumn]

      if (lastSentAt === todayIso) continue

      const profile = profileMap.get(financeiro.aluno_id) || null
      if (!profile?.email) continue

      candidates.push({
        financeiro,
        profile,
        type: reminderType,
        dueDate: financeiro.proximo_vencimento,
        daysUntilDue: differenceInDays(financeiro.proximo_vencimento, today),
      })
    }

    const sentReminderIds: string[] = []

    for (const candidate of candidates) {
      await sendEmail({
        resendApiKey,
        from: emailFrom,
        to: candidate.profile?.email || '',
        subject: getReminderSubject(candidate.type),
        html: getReminderHtml(candidate),
      })

      const reminderColumn = getReminderColumn(candidate.type)
      const { error: updateError } = await supabase
        .from('financeiro_alunos')
        .update({ [reminderColumn]: todayIso })
        .eq('id', candidate.financeiro.id)

      if (updateError) throw updateError
      sentReminderIds.push(candidate.financeiro.id)
    }

    if (candidates.length) {
      await sendEmail({
        resendApiKey,
        from: emailFrom,
        to: adminEmail,
        subject: `Arena ABS: ${candidates.length} aviso(s) financeiro(s) enviados`,
        html: getAdminSummaryHtml(candidates),
      })
    }

    return new Response(JSON.stringify({
      ok: true,
      processed: latestFinanceByAluno.size,
      sent: candidates.length,
      updatedIds: sentReminderIds,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})
