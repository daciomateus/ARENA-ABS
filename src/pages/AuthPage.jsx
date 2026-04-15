import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.email('Informe um e-mail valido'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
})

const registerSchema = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  telefone: z.string().min(8, 'Informe um telefone valido'),
  email: z.email('Informe um e-mail valido'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
})

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, isAuthenticated, loading } = useAuth()
  const [mode, setMode] = useState('login')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTarget = useMemo(() => location.state?.from?.pathname || '/', [location.state])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTarget, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, redirectTarget])

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', telefone: '', email: '', password: '' },
  })

  async function handleLogin(values) {
    setSubmitting(true)
    setError('')
    setFeedback('')
    try {
      await signIn(values)
    } catch (loginError) {
      setError(loginError.message || 'Nao foi possivel entrar agora.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(values) {
    setSubmitting(true)
    setError('')
    setFeedback('')
    try {
      const data = await signUp(values)
      if (data?.session) {
        return
      }
      setFeedback('Conta criada com sucesso. Se o Supabase exigir confirmacao por e-mail, confirme antes de entrar.')
      setMode('login')
      registerForm.reset()
    } catch (registerError) {
      setError(registerError.message || 'Nao foi possivel criar a conta agora.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="section-card">
        <div className="mb-5 flex items-center gap-3">
          <img src="/arena-abs-logo.jpeg" alt="Logo Arena ABS" className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm" />
          <div>
            <span className="brand-badge">Arena ABS</span>
            <p className="mt-2 text-sm text-slate-500">Acesse sua conta para reservar e concluir matriculas.</p>
          </div>
        </div>

        <PageHeader
          eyebrow="Acesso"
          title="Entre ou crie sua conta"
          description="Seu cadastro fica salvo no banco e libera a finalizacao das reservas e matriculas."
        />

        <div className="flex gap-2 rounded-2xl bg-sand-50 p-1">
          <button className={mode === 'login' ? 'primary-btn flex-1' : 'secondary-btn flex-1'} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'primary-btn flex-1' : 'secondary-btn flex-1'} type="button" onClick={() => setMode('register')}>
            Cadastro
          </button>
        </div>

        {mode === 'login' ? (
          <form className="mt-5 space-y-4" onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div>
              <label className="field-label" htmlFor="login-email">E-mail</label>
              <input id="login-email" className="input-shell" type="email" {...loginForm.register('email')} />
              {loginForm.formState.errors.email ? <p className="helper-text mt-2 text-rose-600">{loginForm.formState.errors.email.message}</p> : null}
            </div>
            <div>
              <label className="field-label" htmlFor="login-password">Senha</label>
              <input id="login-password" className="input-shell" type="password" {...loginForm.register('password')} />
              {loginForm.formState.errors.password ? <p className="helper-text mt-2 text-rose-600">{loginForm.formState.errors.password.message}</p> : null}
            </div>
            <button className="primary-btn w-full" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={registerForm.handleSubmit(handleRegister)}>
            <div>
              <label className="field-label" htmlFor="register-name">Nome completo</label>
              <input id="register-name" className="input-shell" type="text" {...registerForm.register('nome')} />
              {registerForm.formState.errors.nome ? <p className="helper-text mt-2 text-rose-600">{registerForm.formState.errors.nome.message}</p> : null}
            </div>
            <div>
              <label className="field-label" htmlFor="register-phone">Telefone</label>
              <input id="register-phone" className="input-shell" type="tel" {...registerForm.register('telefone')} />
              {registerForm.formState.errors.telefone ? <p className="helper-text mt-2 text-rose-600">{registerForm.formState.errors.telefone.message}</p> : null}
            </div>
            <div>
              <label className="field-label" htmlFor="register-email">E-mail</label>
              <input id="register-email" className="input-shell" type="email" {...registerForm.register('email')} />
              {registerForm.formState.errors.email ? <p className="helper-text mt-2 text-rose-600">{registerForm.formState.errors.email.message}</p> : null}
            </div>
            <div>
              <label className="field-label" htmlFor="register-password">Senha</label>
              <input id="register-password" className="input-shell" type="password" {...registerForm.register('password')} />
              {registerForm.formState.errors.password ? <p className="helper-text mt-2 text-rose-600">{registerForm.formState.errors.password.message}</p> : null}
            </div>
            <button className="primary-btn w-full" type="submit" disabled={submitting}>
              {submitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        )}

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {feedback ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</p> : null}
      </section>
    </div>
  )
}
