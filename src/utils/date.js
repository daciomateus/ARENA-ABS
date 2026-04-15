import { format, isBefore, isSameDay, parseISO, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RESERVATION_HOURS } from './constants'

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

export function formatDateLabel(date) {
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

export function formatMobileDateLabel(date) {
  return format(date, "EEE, dd 'de' MMMM", { locale: ptBR }).replace('.', '')
}

export function formatShortDate(date) {
  return format(date, 'dd/MM/yyyy')
}

export function getBookableDates(limit = 14) {
  const dates = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (dates.length < limit) {
    const day = cursor.getDay()
    if (day >= 1 && day <= 6) {
      dates.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function isReservationSlotAvailable(reservations, court, dateString, hour) {
  return !reservations.some((reservation) => {
    return reservation.quadra === court && reservation.data_reserva === dateString && reservation.horario === hour && reservation.status !== 'cancelada'
  })
}

export function buildReservationDateTime(dateString, hour) {
  const [hours, minutes] = hour.split(':').map(Number)
  const base = parseISO(`${dateString}T00:00:00`)
  return setMinutes(setHours(base, hours), minutes)
}

export function canCancelReservation(reservation) {
  if (!reservation?.data_reserva || !reservation?.horario) return false
  const slotDate = buildReservationDateTime(reservation.data_reserva, reservation.horario)
  return !isBefore(slotDate, new Date())
}

export function isAllowedBookingDate(date) {
  const weekday = date.getDay()
  return weekday >= 1 && weekday <= 6
}

export function isAllowedHour(hour) {
  return RESERVATION_HOURS.includes(hour)
}

export function sameReservationDay(dateA, dateB) {
  return isSameDay(dateA, dateB)
}
