import { supabase } from '../lib/supabaseClient'

export async function listFinanceiro({ isAdmin = false, alunoId } = {}) {
  let query = supabase.from('financeiro_alunos').select('*').order('proximo_vencimento', { ascending: true })

  if (!isAdmin && alunoId) {
    query = query.eq('aluno_id', alunoId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createFinanceiro(payload) {
  let { data, error } = await supabase.from('financeiro_alunos').insert(payload).select().single()

  if (error?.message?.includes("observacoes") && error?.message?.includes("financeiro_alunos")) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.observacoes
    ;({ data, error } = await supabase.from('financeiro_alunos').insert(fallbackPayload).select().single())
  }

  if (error) throw error
  return data
}


export async function updateFinanceiro(id, payload) {
  let { data, error } = await supabase.from('financeiro_alunos').update(payload).eq('id', id).select().single()

  if (error?.message?.includes("observacoes") && error?.message?.includes("financeiro_alunos")) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.observacoes
    ;({ data, error } = await supabase.from('financeiro_alunos').update(fallbackPayload).eq('id', id).select().single())
  }

  if (error) throw error
  return data
}

