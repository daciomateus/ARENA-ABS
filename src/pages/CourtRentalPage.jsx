import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, ChevronUp, LoaderCircle, Sparkles, X } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { savePendingReservation, loadPendingReservation } from '../lib/bookingDraft'
import { COURTS, RESERVATION_HOURS } from '../utils/constants'
import { formatCurrency, formatDateLabel, formatMobileDateLabel, getBookableDates, isReservationSlotAvailable } from '../utils/date'
import { listReservations } from '../services/reservationService'

const LOAD_TIMEOUT_MS = 8000

function getSlotPrice(hour) {
  return hour === '17:00' ? 60 : 70
}

function getSlotId(slot) {
  return `${slot.data_reserva}-${slot.quadra}-${slot.horario}`
}

export function CourtRentalPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const bookableDates = useMemo(() => getBookableDates(12), [])
  const [selectedDate, setSelectedDate] = useState(format(bookableDates[0], 'yyyy-MM-dd'))
  const [selectedCourt, setSelectedCourt] = useState(COURTS[0])

  const visibleDateRange = useMemo(
    () => ({
      start: format(bookableDates[0], 'yyyy-MM-dd'),
      end: format(bookableDates[bookableDates.length - 1], 'yyyy-MM-dd'),
    }),
    [bookableDates],
  )

  const loadReservations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await Promise.race([
        listReservations({
          isAdmin: true,
          columns: 'id,quadra,data_reserva,horario,status',
          filters: {
            data_reserva_gte: visibleDateRange.start,
            data_reserva_lte: visibleDateRange.end,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('A agenda demorou para responder.')), LOAD_TIMEOUT_MS),
        ),
      ])

      setReservations(data)
      setError('')
    } catch {
      setReservations([])
      setError('Nao foi possivel validar a disponibilidade agora. Voce ainda pode selecionar horarios e confirmar no checkout.')
    } finally {
      setLoading(false)
    }
  }, [visibleDateRange.end, visibleDateRange.start])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  useEffect(() => {
    const parsed = loadPendingReservation()
    if (!parsed) return
    if (parsed?.selectedDate) setSelectedDate(parsed.selectedDate)
    if (parsed?.selectedCourt) setSelectedCourt(parsed.selectedCourt)
    if (Array.isArray(parsed?.selectedSlots)) setSelectedSlots(parsed.selectedSlots)
  }, [])

  useEffect(() => {
    savePendingReservation({
      selectedDate,
      selectedCourt,
      selectedSlots,
    })
  }, [selectedDate, selectedCourt, selectedSlots])

  function isSlotSelected(court, hour) {
    return selectedSlots.some((slot) => slot.data_reserva === selectedDate && slot.quadra === court && slot.horario === hour)
  }

  function toggleSlot(court, hour, available) {
    if (!available) return

    const slot = {
      data_reserva: selectedDate,
      quadra: court,
      horario: hour,
      price: getSlotPrice(hour),
    }

    setSelectedCourt(court)
    setError('')

    setSelectedSlots((current) => {
      const exists = current.some((item) => getSlotId(item) === getSlotId(slot))
      if (exists) {
        const next = current.filter((item) => getSlotId(item) !== getSlotId(slot))
        setFeedback(next.length ? 'Horario removido da selecao.' : '')
        return next
      }

      const next = [...current, slot].sort((a, b) => a.horario.localeCompare(b.horario) || a.quadra.localeCompare(b.quadra))
      setFeedback('Horario adicionado. Voce pode escolher mais de um antes de confirmar.')
      return next
    })
  }

  function removeSelectedSlot(slotId) {
    setSelectedSlots((current) => current.filter((item) => getSlotId(item) !== slotId))
  }

  function handleCheckout() {
    if (!selectedSlots.length) {
      setError('Selecione pelo menos um horario para continuar.')
      return
    }

    savePendingReservation({
      selectedDate,
      selectedCourt,
      selectedSlots,
    })

    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
      return
    }

    navigate('/checkout')
  }

  const selectedDateLabel = useMemo(() => {
    const match = bookableDates.find((date) => format(date, 'yyyy-MM-dd') === selectedDate)
    return match ? formatDateLabel(match) : 'Selecione um dia'
  }, [bookableDates, selectedDate])

  const totalValue = selectedSlots.reduce((sum, slot) => sum + slot.price, 0)

  return (
    <div className="space-y-6 pb-32 md:pb-6">
      <section className="section-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url('/schedule-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(252,250,247,0.96),rgba(247,244,239,0.98))]" />

        <div className="relative space-y-6">
          <PageHeader
            eyebrow="Quadras"
            title="Agenda de reservas"
            description="Escolha o dia e toque nos horarios disponiveis. Voce pode reservar mais de um antes de confirmar."
          />

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <Sparkles size={16} className="text-brand-500" />
                  Resumo rapido
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p><strong className="text-ink-950">Dia:</strong> {selectedDateLabel}</p>
                  <p><strong className="text-ink-950">Quadra em foco:</strong> {selectedCourt}</p>
                  <p><strong className="text-ink-950">Horarios escolhidos:</strong> {selectedSlots.length}</p>
                  <p><strong className="text-ink-950">Total:</strong> {selectedSlots.length ? formatCurrency(totalValue) : 'Selecione horarios'}</p>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="mobile-day">Dia</label>
                <select id="mobile-day" className="input-shell md:hidden" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                  {bookableDates.map((date) => {
                    const value = format(date, 'yyyy-MM-dd')
                    return (
                      <option key={value} value={value}>
                        {formatMobileDateLabel(date)}
                      </option>
                    )
                  })}
                </select>
                <div className="mt-2 hidden gap-2 overflow-x-auto pb-1 md:flex">
                  {bookableDates.map((date) => {
                    const value = format(date, 'yyyy-MM-dd')
                    const active = value === selectedDate
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedDate(value)}
                        className={`min-w-[150px] rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">Dia</span>
                        <strong className="mt-1 block text-sm">{formatDateLabel(date)}</strong>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="mobile-court">Quadra em foco</label>
                <select id="mobile-court" className="input-shell md:hidden" value={selectedCourt} onChange={(event) => setSelectedCourt(event.target.value)}>
                  {COURTS.map((court) => (
                    <option key={court} value={court}>{court}</option>
                  ))}
                </select>
                <div className="mt-2 hidden grid-cols-2 gap-2 md:grid">
                  {COURTS.map((court) => {
                    const active = court === selectedCourt
                    return (
                      <button
                        key={court}
                        type="button"
                        onClick={() => setSelectedCourt(court)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? 'border-brand-300 bg-brand-50 text-brand-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        {court}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p> : null}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={16} className="text-brand-500" />
                Visualizando {selectedDateLabel}
                {loading ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <LoaderCircle size={12} className="animate-spin" />
                    Atualizando
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {COURTS.map((court) => (
                  <article key={court} className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-ink-950">{court}</h3>
                      <span className="rounded-full bg-sand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {court === selectedCourt ? 'Atual' : 'Livre'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Toque em um ou mais horarios livres para selecionar.</p>

                    <div className="mt-4 space-y-3">
                      {RESERVATION_HOURS.map((hour) => {
                        const available = isReservationSlotAvailable(reservations, court, selectedDate, hour)
                        const selected = isSlotSelected(court, hour)
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => toggleSlot(court, hour, available)}
                            disabled={!available}
                            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              selected
                                ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
                                : available
                                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800'
                                  : 'cursor-not-allowed border-rose-200 bg-rose-50/90 text-rose-700 opacity-90'
                            }`}
                          >
                            <div className="space-y-2">
                              <strong className="block text-base leading-none">{hour}</strong>
                              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-current/15 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                                {selected ? <CheckCircle2 size={12} /> : null}
                                <span className="whitespace-nowrap">{selected ? 'Selecionado' : available ? 'Disponivel' : 'Reservado'}</span>
                              </div>
                              <span className="block text-xs opacity-85">{formatCurrency(getSlotPrice(hour))}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedSlots.length ? (
        <div className="fixed inset-x-3 bottom-3 z-40 md:inset-x-auto md:right-6 md:w-[420px]">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_24px_50px_rgba(20,33,61,0.18)] backdrop-blur sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Finalizar reserva</p>
                <strong className="mt-1 block text-sm text-ink-950">{selectedSlots.length} horario(s)</strong>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-950">{formatCurrency(totalValue)}</p>
                <button type="button" onClick={() => setShowSummary((current) => !current)} className="mt-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800">
                  {showSummary ? 'Ocultar resumo' : 'Ver resumo'}
                  <ChevronUp size={12} className={`ml-1 inline-block transition ${showSummary ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            {showSummary ? (
              <div className="mt-3 rounded-2xl bg-sand-50 p-3">
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map((slot) => (
                    <button
                      key={getSlotId(slot)}
                      type="button"
                      onClick={() => removeSelectedSlot(getSlotId(slot))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-800"
                    >
                      <span>{slot.horario} · {slot.quadra}</span>
                      <X size={12} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button className="primary-btn mt-3 w-full py-2.5" type="button" onClick={handleCheckout}>
              {isAuthenticated ? 'Ir para checkout' : 'Entrar para continuar'}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && reservations.length === 0 ? (
        <EmptyState title="Nenhuma reserva encontrada" description="Assim que as reservas forem criadas, a disponibilidade vai aparecer aqui." />
      ) : null}
    </div>
  )
}

