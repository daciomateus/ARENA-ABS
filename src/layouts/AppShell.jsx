import { useMemo } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { APP_NAME } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'AA'
  )
}

function getShortName(name) {
  if (!name) return 'Perfil ativo'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).join(' ')
}

export function AppShell({ children }) {
  const { isAuthenticated, isAdmin, signOut, profile, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = useMemo(() => {
    const items = [
      { to: '/', label: 'Inicio' },
      { to: '/quadras', label: 'Quadras' },
    ]

    if (isAuthenticated) {
      items.push({ to: '/matricula', label: 'Matricula' })
      items.push({ to: '/minhas-reservas', label: 'Minhas reservas' })
    }

    if (isAdmin) {
      items.push({ to: '/admin', label: 'Admin' })
    }

    return items
  }, [isAuthenticated, isAdmin])

  const showQuickReserve = !isAuthenticated && location.pathname !== '/quadras'
  const displayName = profile?.nome || user?.user_metadata?.nome || user?.email?.split('@')[0] || ''
  const profileInitials = getInitials(displayName)
  const shortName = getShortName(displayName)

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Nao foi possivel encerrar a sessao.', error)
    }
  }

  return (
    <div className="app-shell">
      <header className="glass-panel relative z-20 mb-4 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <Link to="/" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src="/arena-abs-logo.jpeg" alt="Logo Arena ABS" className="h-11 w-11 object-cover sm:h-12 sm:w-12" />
            </Link>
            <div>
              <p className="text-sm font-bold text-ink-950">{APP_NAME}</p>
              <p className="text-xs text-slate-500">Beach sports, quadras e matriculas</p>
            </div>
          </div>

          <nav className="relative z-0 flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 lg:justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${isActive ? 'nav-link nav-link-active' : 'nav-link'} whitespace-nowrap`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative z-30 flex shrink-0 items-center justify-between gap-3 lg:justify-end">
            {isAuthenticated ? (
              <>
                <div className="relative z-30 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-xs font-black uppercase tracking-[0.16em] text-brand-700">
                    {profileInitials}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-ink-950">{shortName}</strong>
                    <span className="truncate text-xs">{isAdmin ? 'Conta admin' : 'Conta ativa'}</span>
                  </div>
                  {isAdmin ? <ShieldCheck size={16} className="shrink-0 text-brand-500" /> : <UserRound size={16} className="shrink-0 text-brand-500" />}
                </div>
                <button className="secondary-btn relative z-30 px-4 py-2.5" type="button" onClick={handleSignOut}>
                  <LogOut size={16} className="mr-2" />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="secondary-btn px-4 py-2.5">
                  <UserRound size={16} className="mr-2" />
                  Entrar
                </Link>
                {showQuickReserve ? (
                  <Link to="/quadras" className="primary-btn px-4 py-2.5">
                    <CalendarDays size={16} className="mr-2" />
                    Reservar
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-8 px-2 text-center text-xs text-slate-400">
        <p>{APP_NAME}</p>
      </footer>
    </div>
  )
}
