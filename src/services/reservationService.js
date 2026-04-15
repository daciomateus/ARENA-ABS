import { supabase } from '../lib/supabaseClient'

function buildLegacyReservationFields(payload) {
  const dataReserva = payload.data_reserva
  const horario = payload.horario
  const [hours = '00', minutes = '00'] = String(horario || '00:00').split(':')
  const datetime = dataReserva && horario ? `${dataReserva}T${hours}:${minutes}:00` : null

  return {
    customer_name: payload.nome,
    phone: payload.telefone,
    court: payload.quadra,
    hour: Number(hours),
    price: payload.price ?? null,
    datetime,
  }
}

export async function listReservations({ isAdmin = false, userId, filters = {}, columns = '*' } = {}) {
  let query = supabase.from('reservas').select(columns).order('data_reserva', { ascending: true }).order('horario', { ascending: true })

  if (!isAdmin && userId) {
    query = query.eq('user_id', userId)
  }

  if (filters.nome) query = query.ilike('nome', `%${filters.nome}%`)
  if (filters.quadra) query = query.eq('quadra', filters.quadra)
  if (filters.horario) query = query.eq('horario', filters.horario)
  if (filters.data_reserva) query = query.eq('data_reserva', filters.data_reserva)
  if (filters.data_reserva_gte) query = query.gte('data_reserva', filters.data_reserva_gte)
  if (filters.data_reserva_lte) query = query.lte('data_reserva', filters.data_reserva_lte)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createReservation(payload) {
  const reservationPayload = {
    id: payload.id || crypto.randomUUID(),
    ...buildLegacyReservationFields(payload),
    ...payload,
  }

  const { data, error } = await supabase.from('reservas').insert(reservationPayload).select().single()
  if (error) throw error
  return data
}

export async function cancelReservation(id) {
  const { data, error } = await supabase
    .from('reservas')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function checkReservationConflict({ quadra, data_reserva, horario }) {
  const { data, error } = await supabase
    .from('reservas')
    .select('id')
    .eq('quadra', quadra)
    .eq('data_reserva', data_reserva)
    .eq('horario', horario)
    .neq('status', 'cancelada')
    .limit(1)

  if (error) throw error
  return Boolean(data?.length)
}
