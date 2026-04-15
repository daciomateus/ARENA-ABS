import { addDays, differenceInCalendarDays, format, isToday, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatShortDate } from './date'

export function getFinanceiroStatus(registro) {
  if (!registro) {
    return {
      key: 'pendente',
      label: 'Pendente',
      detail: 'Sem dados de vencimento.',
    }
  }

  const paymentDate = registro.data_ultimo_pagamento ? startOfDay(parseISO(`${registro.data_ultimo_pagamento}T00:00:00`)) : null
  const dueDate = registro.proximo_vencimento ? startOfDay(parseISO(`${registro.proximo_vencimento}T00:00:00`)) : null
  const today = startOfDay(new Date())

  if (!dueDate && paymentDate) {
    const calculatedDueDate = addDays(paymentDate, 30)
    return {
      key: 'pendente',
      label: 'Pendente',
      detail: `Proximo vencimento previsto para ${formatShortDate(calculatedDueDate)}.`,
    }
  }

  if (!dueDate) {
    return {
      key: 'pendente',
      label: 'Pendente',
      detail: 'Defina a data do pagamento para calcular o vencimento.',
    }
  }

  if (registro.status === 'vencido' || differenceInCalendarDays(dueDate, today) < 0) {
    return {
      key: 'vencido',
      label: 'Vencida',
      detail: `Venceu em ${formatShortDate(dueDate)}.`,
    }
  }

  if (isToday(dueDate)) {
    return {
      key: 'vence_hoje',
      label: 'Vence hoje',
      detail: 'O vencimento e hoje.',
    }
  }

  const daysUntilDue = differenceInCalendarDays(dueDate, today)

  if (daysUntilDue <= 7) {
    return {
      key: 'vence_em_breve',
      label: 'Vence em breve',
      detail: `Faltam ${daysUntilDue} dia(s) para vencer.`,
    }
  }

  return {
    key: 'pago',
    label: 'Em dia',
    detail: `Proximo vencimento em ${formatShortDate(dueDate)}.`,
  }
}

export function buildFinanceiroPayload({ alunoId, modalidade, valor, dataPagamento, observacoes = '' }) {
  const paymentDate = startOfDay(parseISO(`${dataPagamento}T00:00:00`))
  const nextDueDate = addDays(paymentDate, 30)

  return {
    aluno_id: alunoId,
    modalidade,
    valor: Number(valor),
    data_ultimo_pagamento: dataPagamento,
    proximo_vencimento: nextDueDate.toISOString().slice(0, 10),
    status: 'em_dia',
    observacoes,
    ultimo_aviso_7_dias_em: null,
    ultimo_aviso_vencimento_em: null,
    ultimo_aviso_atraso_em: null,
  }
}

export function buildReservationDayOptions(reservas) {
  const uniqueDates = [...new Set((reservas || []).map((item) => item.data_reserva).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))

  return uniqueDates.map((dateString) => {
    const date = new Date(`${dateString}T00:00:00`)
    const label = format(date, "EEEE, dd/MM", { locale: ptBR })
      .replace('-feira', '')
      .replace(',', '')
      .trim()

    return {
      value: dateString,
      label,
    }
  })
}

