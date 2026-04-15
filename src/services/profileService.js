import { supabase } from '../lib/supabaseClient'

export async function ensureProfileExists(user, overrides = {}) {
  if (!user) return null

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('tipo_usuario')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfileError) throw existingProfileError

  const payload = {
    id: user.id,
    nome: overrides.nome || user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario',
    email: user.email,
    telefone: overrides.telefone || user.user_metadata?.telefone || '',
    tipo_usuario: overrides.tipo_usuario || existingProfile?.tipo_usuario || 'usuario',
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) throw error
  return payload
}

export async function getProfileById(id) {
  if (!id) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateProfile(id, payload) {
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
