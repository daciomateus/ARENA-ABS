import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Dumbbell, LogIn, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function ServiceLinkCard({ badge, title, description, to }) {
  return (
    <Link
      to={to}
      className="info-card block transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_16px_36px_rgba(20,33,61,0.10)]"
    >
      <span className="brand-badge">{badge}</span>
      <h3 className="mt-3 text-lg font-bold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  )
}

export function HomePage() {
  const { isAuthenticated, isAdmin, profile } = useAuth()

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="glass-panel overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(231,108,23,0.20),transparent_34%),linear-gradient(145deg,#14213d_0%,#173052_48%,#21466f_100%)] p-4 text-white sm:p-7">
        <div className="grid gap-4 lg:grid-cols-[1.7fr_0.95fr] lg:items-start">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <img src="/arena-abs-logo.jpeg" alt="Logo Arena ABS" className="h-12 w-12 rounded-2xl border border-white/15 bg-white/10 object-cover shadow-lg shadow-black/10 sm:h-14 sm:w-14" />
              <div>
                <span className="brand-badge bg-white/14 text-white">Arena ABS</span>
                <p className="mt-2 text-xs text-white/72 sm:text-sm">Beach sports e reservas esportivas</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-[1.9rem] font-black leading-tight tracking-tight text-white sm:text-5xl">
                Uma area mais rapida para reservar quadras e organizar matriculas.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
                Escolha horarios entre 17h e 21h, acompanhe sua conta e envie sua matricula para as modalidades da arena em poucos toques.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-3xl border border-white/16 bg-white/10 px-4 py-3 backdrop-blur">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/55">Funcionamento</span>
                <strong className="mt-2 block text-base font-bold">Seg a sab · 17h as 21h</strong>
              </article>
              <article className="rounded-3xl border border-white/16 bg-white/10 px-4 py-3 backdrop-blur">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/55">Quadras</span>
                <strong className="mt-2 block text-base font-bold">A, B, S e E</strong>
              </article>
            </div>
          </div>

          <div className="space-y-3">
            <article className="rounded-[28px] border border-white/16 bg-white/10 p-4 backdrop-blur">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">Acao principal</span>
              <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">Alugar quadra</h2>
              <p className="mt-2 text-sm leading-6 text-white/72">Abra a agenda, toque em um horario livre e confirme a reserva.</p>
              <Link to="/quadras" className="mt-4 primary-btn w-full sm:w-auto">
                <CalendarDays size={16} className="mr-2" />
                Abrir agenda
              </Link>
            </article>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {isAuthenticated ? (
                <article className="rounded-[28px] border border-white/16 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-sm font-black uppercase tracking-[0.14em] text-white">
                      {profile?.nome?.split(' ').slice(0, 2).map((part) => part[0]).join('') || 'AA'}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">Conta ativa</span>
                      <h2 className="mt-1 text-lg font-bold text-white">Sua area ja esta liberada.</h2>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/matricula" className="secondary-btn border-white/20 bg-white/10 px-4 py-2.5 text-white hover:border-white/40 hover:text-white">
                      <Dumbbell size={16} className="mr-2" />
                      Fazer matricula
                    </Link>
                    <Link to="/minhas-reservas" className="secondary-btn border-white/20 bg-white/10 px-4 py-2.5 text-white hover:border-white/40 hover:text-white">
                      <UserRound size={16} className="mr-2" />
                      Minhas reservas
                    </Link>
                  </div>
                </article>
              ) : (
                <article className="rounded-[28px] border border-white/16 bg-white/10 p-4 backdrop-blur">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200">Conta</span>
                  <h2 className="mt-3 text-lg font-bold text-white sm:text-xl">Entre para liberar sua area.</h2>
                  <Link to="/login" className="mt-4 secondary-btn w-full border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white sm:w-auto">
                    <LogIn size={16} className="mr-2" />
                    Entrar agora
                  </Link>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="section-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="brand-badge">Servicos</span>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">O essencial em poucos caminhos.</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                A agenda e a area do aluno ficam lado a lado, com acesso rapido ao que voce mais usa.
              </p>
            </div>
            {isAdmin ? (
              <Link to="/admin" className="secondary-btn">
                <ShieldCheck size={16} className="mr-2" />
                Painel admin
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <ServiceLinkCard
              badge="Quadras"
              title="Reserva online"
              description="Toque no horario livre e finalize em poucos passos."
              to="/quadras"
            />
            <ServiceLinkCard
              badge="Planos"
              title="Matricula mensal"
              description="Inscricao de Beach Tennis e Futevolei pela conta logada."
              to={isAuthenticated ? '/matricula' : '/login'}
            />
          </div>
        </div>

        <aside className="section-card">
          <span className="brand-badge">Modalidades</span>
          <h2 className="section-title mt-4">Planos atuais</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-sand-50 p-4">
              <strong className="text-ink-950">Beach Tennis · Caio</strong>
              <p className="mt-2 text-sm text-slate-500">1x por semana: R$ 130 · 2x por semana: R$ 250</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-sand-50 p-4">
              <strong className="text-ink-950">Beach Tennis · Iago</strong>
              <p className="mt-2 text-sm text-slate-500">1x por semana: R$ 130 · 2x por semana: R$ 250</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-sand-50 p-4">
              <strong className="text-ink-950">Futevolei · Marrom</strong>
              <p className="mt-2 text-sm text-slate-500">1x por semana: R$ 80</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
