import { useCallback, useEffect, useState } from 'react'
import { CalendarX2 } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { listFinanceiro } from '../services/monthlyService'
import { cancelReservation, listReservations } from '../services/reservationService'
import { formatCurrency, formatShortDate } from '../utils/date'
import { getFinanceiroStatus } from '../utils/monthly'

export function MyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [financeiro, setFinanceiro] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  const loadReservations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [reservationData, financeiroData] = await Promise.all([
        listReservations({ userId: user.id }),
        listFinanceiro({ alunoId: user.id }),
      ])
      setReservations(reservationData)
      setFinanceiro(financeiroData)
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Nao foi possivel carregar suas reservas.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  async function handleCancel(id) {
    setCancellingId(id)
    setError('')
    setFeedback('')
    try {
      await cancelReservation(id)
      setFeedback('Reserva cancelada com sucesso.')
      await loadReservations()
    } catch (cancelError) {
      setError(cancelError.message || 'Nao foi possivel cancelar esta reserva.')
    } finally {
      setCancellingId('')
    }
  }

  return (
    <section className="section-card space-y-6">
      <PageHeader eyebrow="Minhas reservas" title="Suas reservas ativas e historico" description="Acompanhe sua conta, veja os horarios confirmados e cancele com um toque quando precisar." />

      {loading ? <LoadingState title="Carregando reservas" /> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {feedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p> : null}

      {!loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-sand-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Reservas</p>
            <strong className="mt-2 block text-2xl font-black text-ink-950">{reservations.length}</strong>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Ativas</p>
            <strong className="mt-2 block text-2xl font-black text-emerald-700">{reservations.filter((reservation) => reservation.status !== 'cancelada').length}</strong>
          </article>
          <article className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700">Mensalidades</p>
            <strong className="mt-2 block text-2xl font-black text-brand-700">{financeiro.length}</strong>
          </article>
        </div>
      ) : null}

      {!loading && financeiro.length ? (
        <div className="space-y-3">
          <div>
            <span className="brand-badge">Mensalidade</span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-950">Status da sua conta</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {financeiro.map((registro) => {
              const monthlyStatus = getFinanceiroStatus(registro)
              return (
                <article key={registro.id} className="info-card flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-ink-950">{registro.modalidade || 'Mensalidade'}</h3>
                      <p className="mt-1 text-sm text-slate-500">Proximo vencimento: {registro.proximo_vencimento ? formatShortDate(new Date(`${registro.proximo_vencimento}T00:00:00`)) : 'Nao definido'}</p>
                    </div>
                    <StatusBadge status={monthlyStatus.key} label={monthlyStatus.label} />
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong className="text-ink-950">Valor:</strong> {formatCurrency(registro.valor)}</p>
                    <p><strong className="text-ink-950">Ultimo pagamento:</strong> {registro.data_ultimo_pagamento ? formatShortDate(new Date(`${registro.data_ultimo_pagamento}T00:00:00`)) : 'Nao informado'}</p>
                    <p>{monthlyStatus.detail}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      {!loading && reservations.length === 0 ? (
        <EmptyState title="Nenhuma reserva encontrada" description="Assim que voce reservar uma quadra, ela aparecera aqui com status e dados do horario." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reservations.map((reservation) => (
          <article key={reservation.id} className="info-card flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink-950">{reservation.quadra}</h3>
                <p className="mt-1 text-sm text-slate-500">{formatShortDate(new Date(`${reservation.data_reserva}T00:00:00`))} · {reservation.horario}</p>
              </div>
              <StatusBadge status={reservation.status} />
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p><strong className="text-ink-950">Nome:</strong> {reservation.nome}</p>
              <p><strong className="text-ink-950">E-mail:</strong> {reservation.email}</p>
              <p><strong className="text-ink-950">Telefone:</strong> {reservation.telefone}</p>
            </div>

            <button
              type="button"
              className="secondary-btn mt-auto w-full"
              disabled={reservation.status === 'cancelada' || cancellingId === reservation.id}
              onClick={() => handleCancel(reservation.id)}
            >
              <CalendarX2 size={16} className="mr-2" />
              {reservation.status === 'cancelada' ? 'Reserva cancelada' : cancellingId === reservation.id ? 'Cancelando...' : 'Cancelar reserva'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

