import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowRight, CreditCard, QrCode, UserRound, Wallet } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { createEnrollment, listEnrollments } from '../services/enrollmentService'
import { ENROLLMENT_OPTIONS } from '../utils/constants'
import { formatCurrency } from '../utils/date'

const enrollmentSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  email: z.email('Informe um e-mail valido'),
  telefone: z.string().min(8, 'Informe um telefone valido'),
  modalidade: z.string().min(1, 'Selecione uma modalidade'),
  forma_pagamento: z.string().min(1, 'Selecione a forma de pagamento'),
  observacoes: z.string().optional(),
})

const paymentOptions = [
  {
    id: 'pix',
    label: 'Pix',
    helper: 'Pagamento mais rapido para liberar a matricula.',
    icon: QrCode,
  },
  {
    id: 'cartao',
    label: 'Cartao presencial',
    helper: 'Pagamento direto na arena no atendimento.',
    icon: CreditCard,
  },
  {
    id: 'dinheiro',
    label: 'Dinheiro na arena',
    helper: 'Combine o pagamento presencialmente.',
    icon: Wallet,
  },
]

function buildEnrollmentNotes(observacoes, paymentLabel) {
  const paymentLine = `Forma de pagamento: ${paymentLabel}`
  return observacoes ? `${paymentLine}\n${observacoes}` : paymentLine
}

export function EnrollmentPage() {
  const { user, profile } = useAuth()
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [enrollments, setEnrollments] = useState([])
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      nome: profile?.nome || '',
      email: profile?.email || user?.email || '',
      telefone: profile?.telefone || '',
      modalidade: '',
      forma_pagamento: '',
      observacoes: '',
    },
  })

  const selectedPlanId = form.watch('modalidade')
  const paymentMethod = form.watch('forma_pagamento')
  const selectedPlan = useMemo(
    () => ENROLLMENT_OPTIONS.find((option) => option.id === selectedPlanId),
    [selectedPlanId],
  )
  const selectedPayment = useMemo(
    () => paymentOptions.find((option) => option.id === paymentMethod),
    [paymentMethod],
  )

  useEffect(() => {
    form.reset({
      nome: profile?.nome || '',
      email: profile?.email || user?.email || '',
      telefone: profile?.telefone || '',
      modalidade: '',
      forma_pagamento: '',
      observacoes: '',
    })
    setCurrentStep(1)
  }, [form, profile, user])

  const loadEnrollments = useCallback(async () => {
    if (!user) return
    try {
      const data = await listEnrollments({ userId: user.id })
      setEnrollments(data)
    } catch {
      setEnrollments([])
    }
  }, [user])

  useEffect(() => {
    loadEnrollments()
  }, [loadEnrollments])

  function handleSelectPlan(planId) {
    form.setValue('modalidade', planId, { shouldValidate: true, shouldDirty: true })
    setCurrentStep(2)
    setError('')
    setFeedback('')
  }

  async function handleSubmit(values) {
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      const paymentLabel = paymentOptions.find((option) => option.id === values.forma_pagamento)?.label || values.forma_pagamento

      await createEnrollment({
        user_id: user.id,
        nome: values.nome,
        email: values.email,
        telefone: values.telefone,
        modalidade: values.modalidade,
        observacoes: buildEnrollmentNotes(values.observacoes, paymentLabel),
      })

      setFeedback('Matricula enviada com sucesso. Agora e so seguir com o pagamento.')
      await loadEnrollments()
    } catch (submissionError) {
      setError(submissionError.message || 'Nao foi possivel enviar a matricula agora.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="section-card">
        <PageHeader
          eyebrow="Matricula"
          title="Escolha um plano e siga para o pagamento"
          description="Selecione a modalidade, confirme seus dados e escolha como quer pagar."
        />

        <div className="mb-5 rounded-3xl border border-slate-200 bg-sand-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <UserRound size={18} />
            </div>
            <div>
              <strong className="block text-ink-950">{profile?.nome || user?.email || 'Conta logada'}</strong>
              <span className="text-sm text-slate-500">Os dados abaixo ja acompanham sua conta.</span>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ENROLLMENT_OPTIONS.map((option) => {
            const active = selectedPlanId === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectPlan(option.id)}
                className={`rounded-3xl border p-4 text-left transition ${
                  active
                    ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                <span className="brand-badge">{option.modalidade}</span>
                <h3 className="mt-3 text-base font-bold text-ink-950">{option.turma}</h3>
                <p className="mt-2 text-sm font-semibold text-brand-700">{formatCurrency(option.valor)}</p>
              </button>
            )
          })}
        </div>

        {currentStep === 2 ? (
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-ink-950">Resumo da matricula</strong>
                  <span className="mt-1 block">{selectedPlan ? `${selectedPlan.modalidade} - ${selectedPlan.turma}` : 'Selecione um plano'}</span>
                  <strong className="mt-2 block text-brand-700">{selectedPlan ? formatCurrency(selectedPlan.valor) : ''}</strong>
                  <span className="mt-2 block text-xs text-slate-600">Pagamento: {selectedPayment?.label || 'Escolha uma forma de pagamento abaixo'}</span>
                </div>
                <ArrowRight size={18} className="mt-1 shrink-0" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="nome">Nome completo</label>
                <input id="nome" className="input-shell" type="text" {...form.register('nome')} />
                {form.formState.errors.nome ? <p className="helper-text mt-2 text-rose-600">{form.formState.errors.nome.message}</p> : null}
              </div>
              <div>
                <label className="field-label" htmlFor="telefone">Telefone</label>
                <input id="telefone" className="input-shell" type="tel" {...form.register('telefone')} />
                {form.formState.errors.telefone ? <p className="helper-text mt-2 text-rose-600">{form.formState.errors.telefone.message}</p> : null}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="email">E-mail</label>
              <input id="email" className="input-shell" type="email" {...form.register('email')} />
              {form.formState.errors.email ? <p className="helper-text mt-2 text-rose-600">{form.formState.errors.email.message}</p> : null}
            </div>

            <input type="hidden" {...form.register('modalidade')} />

            <div>
              <label className="field-label">Forma de pagamento</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {paymentOptions.map((option) => {
                  const Icon = option.icon
                  const active = paymentMethod === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => form.setValue('forma_pagamento', option.id, { shouldValidate: true, shouldDirty: true })}
                      className={`rounded-3xl border p-4 text-left transition ${
                        active
                          ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50'
                      }`}
                    >
                      <Icon size={18} className="text-brand-600" />
                      <strong className="mt-3 block text-sm text-ink-950">{option.label}</strong>
                      <p className="mt-2 text-xs text-slate-500">{option.helper}</p>
                    </button>
                  )
                })}
              </div>
              {form.formState.errors.forma_pagamento ? <p className="helper-text mt-2 text-rose-600">{form.formState.errors.forma_pagamento.message}</p> : null}
            </div>

            <div>
              <label className="field-label" htmlFor="observacoes">Observacoes</label>
              <textarea id="observacoes" className="input-shell min-h-28 resize-y" {...form.register('observacoes')} />
            </div>

            <button className="primary-btn w-full" type="submit" disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar matricula e seguir para pagamento'}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
            Escolha um plano acima para continuar.
          </div>
        )}

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {feedback ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p> : null}
      </section>

      <aside className="section-card space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-sand-50 p-4 text-sm text-slate-600">
          <strong className="block text-ink-950">Pagamento</strong>
          <p className="mt-2">Depois de enviar a matricula, a proxima etapa e concluir o pagamento da forma escolhida. Podemos ligar isso a Pix ou checkout em seguida.</p>
        </div>

        <div>
          <span className="brand-badge">Historico</span>
          <div className="mt-4 space-y-3">
            {enrollments.length === 0 ? (
              <EmptyState title="Nenhuma matricula enviada" description="Quando voce enviar sua matricula, ela aparecera aqui para acompanhamento." />
            ) : (
              enrollments.map((enrollment) => {
                const plan = ENROLLMENT_OPTIONS.find((option) => option.id === enrollment.modalidade)
                return (
                  <article key={enrollment.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <strong className="text-ink-950">{plan ? `${plan.modalidade} - ${plan.turma}` : enrollment.modalidade}</strong>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{enrollment.observacoes || 'Sem observacoes.'}</p>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

