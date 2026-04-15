import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, LoaderCircle, MessageCircleMore } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { clearPendingReservation, loadPendingReservation } from '../lib/bookingDraft'
import { checkReservationConflict, createReservation } from '../services/reservationService'
import { WHATSAPP_ARENA_NUMBER } from '../utils/constants'
import { formatCurrency, formatShortDate } from '../utils/date'

function getDisplayName(profile, user) {
  return profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Cliente Arena ABS'
}

function getDisplayPhone(profile, user) {
  return profile?.telefone || user?.user_metadata?.telefone || ''
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function buildWhatsappUrl({ reservations, totalValue, name, phone, email }) {
  const lines = [
    'Ola, Arena ABS! Acabei de concluir minha reserva pelo site.',
    '',
    `Cliente: ${name}`,
    `Telefone: ${phone || 'Nao informado'}`,
    `E-mail: ${email}`,
    '',
    'Horarios escolhidos:',
    ...reservations.map((reservation) => `- ${formatShortDate(new Date(`${reservation.data_reserva}T00:00:00`))} | ${reservation.quadra} | ${reservation.horario}`),
    '',
    `Total previsto: ${formatCurrency(totalValue)}`,
  ]

  return `https://wa.me/${WHATSAPP_ARENA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

export function ReservationCheckoutPage() {
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const [draft] = useState(() => loadPendingReservation())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const selectedSlots = useMemo(() => draft?.selectedSlots ?? [], [draft])
  const displayName = useMemo(() => getDisplayName(profile, user), [profile, user])
  const displayPhone = useMemo(() => getDisplayPhone(profile, user), [profile, user])
  const displayEmail = user?.email || profile?.email || ''
  const totalValue = useMemo(() => selectedSlots.reduce((sum, slot) => sum + Number(slot.price || 0), 0), [selectedSlots])

  async function handleConfirm() {
    if (!user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/checkout' } } })
      return
    }

    if (!selectedSlots.length) {
      setError('Escolha pelo menos um horario antes de concluir a reserva.')
      return
    }

    const normalizedPhone = normalizePhone(displayPhone)
    if (!displayName || !displayEmail) {
      setError('Seu cadastro ainda nao terminou de carregar. Tente novamente em alguns segundos.')
      return
    }

    setSubmitting(true)
    setError('')
    setFeedback('')

    try {
      const conflicts = []

      for (const slot of selectedSlots) {
        const hasConflict = await checkReservationConflict({
          quadra: slot.quadra,
          data_reserva: slot.data_reserva,
          horario: slot.horario,
        })

        if (hasConflict) {
          conflicts.push(`${slot.quadra} · ${formatShortDate(new Date(`${slot.data_reserva}T00:00:00`))} · ${slot.horario}`)
        }
      }

      if (conflicts.length) {
        throw new Error(`Alguns horarios acabaram de ser ocupados: ${conflicts.join(' | ')}`)
      }

      const payloads = selectedSlots.map((slot) => ({
        user_id: user.id,
        nome: displayName,
        email: displayEmail,
        telefone: normalizedPhone || displayPhone,
        quadra: slot.quadra,
        data_reserva: slot.data_reserva,
        horario: slot.horario,
        status: 'ativa',
        price: slot.price,
      }))

      const createdReservations = []
      for (const payload of payloads) {
        const created = await createReservation(payload)
        createdReservations.push(created)
      }

      clearPendingReservation()
      const whatsappUrl = buildWhatsappUrl({
        reservations: createdReservations,
        totalValue,
        name: displayName,
        phone: normalizedPhone || displayPhone,
        email: displayEmail,
      })

      setFeedback('Reserva confirmada. Estamos abrindo o WhatsApp para voce concluir o atendimento.')
      window.open(whatsappUrl, '_blank')

      navigate('/minhas-reservas', {
        replace: true,
        state: { feedback: 'Reserva confirmada com sucesso. Voce tambem ja pode concluir pelo WhatsApp.' },
      })
    } catch (checkoutError) {
      setError(checkoutError.message || 'Nao foi possivel concluir a reserva agora.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedSlots.length) {
    return (
      <section className="section-card">
        <PageHeader
          eyebrow="Checkout"
          title="Nenhuma reserva pendente"
          description="Volte para a agenda, escolha um ou mais horarios e finalize por aqui."
        />

        <EmptyState
          title="Sua selecao ainda esta vazia"
          description="Assim que voce escolher horarios na agenda, o resumo de checkout aparece aqui para confirmar e enviar no WhatsApp."
        />

        <div className="mt-6 flex justify-center">
          <button type="button" className="secondary-btn" onClick={() => navigate('/quadras')}>
            <ArrowLeft size={16} className="mr-2" />
            Voltar para a agenda
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="section-card">
        <PageHeader
          eyebrow="Checkout"
          title="Revise antes de enviar no WhatsApp"
          description="Conferimos os horarios, registramos a reserva no sistema e depois abrimos o WhatsApp para voce continuar o atendimento."
          action={
            <button type="button" className="secondary-btn" onClick={() => navigate('/quadras')}>
              <ArrowLeft size={16} className="mr-2" />
              Ajustar horarios
            </button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                <CalendarDays size={16} className="text-brand-500" />
                Horarios escolhidos
              </div>

              <div className="mt-4 space-y-3">
                {selectedSlots.map((slot) => (
                  <div key={`${slot.data_reserva}-${slot.quadra}-${slot.horario}`} className="rounded-2xl border border-slate-200 bg-sand-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block text-sm text-ink-950">{slot.quadra}</strong>
                        <p className="mt-1 text-sm text-slate-600">{formatShortDate(new Date(`${slot.data_reserva}T00:00:00`))} · {slot.horario}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-700">{formatCurrency(slot.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="brand-badge">Resumo da reserva</span>

              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p><strong className="text-ink-950">Nome:</strong> {displayName}</p>
                <p><strong className="text-ink-950">E-mail:</strong> {displayEmail || 'Nao informado'}</p>
                <p><strong className="text-ink-950">Telefone:</strong> {displayPhone || 'Nao informado'}</p>
                <div className="mt-1 h-px bg-slate-200" />
                <div className="flex items-center justify-between gap-3">
                  <span>Quantidade de horarios</span>
                  <strong className="text-ink-950">{selectedSlots.length}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Total previsto</span>
                  <strong className="text-ink-950">{formatCurrency(totalValue)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Perfil</span>
                  <strong className="text-ink-950">{isAdmin ? 'Admin' : 'Aluno'}</strong>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-slate-600">
                Depois da confirmacao, abrimos o WhatsApp da arena com o resumo pronto.
              </div>

              <button type="button" className="primary-btn mt-5 w-full py-3 text-base font-bold shadow-[0_16px_30px_rgba(245,114,14,0.22)] md:py-3" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <LoaderCircle size={16} className="mr-2 animate-spin" /> : <MessageCircleMore size={16} className="mr-2" />}
                {submitting ? 'Confirmando reserva...' : 'Confirmar e abrir WhatsApp'}
              </button>
            </div>

            {feedback ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={16} className="mr-2 inline-block" />
                {feedback}
              </p>
            ) : null}

            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}



