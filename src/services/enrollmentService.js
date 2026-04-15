import { supabase } from '../lib/supabaseClient'

export async function createEnrollment(payload) {
  const { data, error } = await supabase.from('matriculas').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function listEnrollments({ isAdmin = false, userId } = {}) {
  let query = supabase.from('matriculas').select('*').order('created_at', { ascending: false })
  if (!isAdmin && userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
