import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getCurrentSeason, SEASON_EMOJI } from '../../lib/utils'

const season = getCurrentSeason()

const navItems = [
  { to: '/',            label: 'Home',        icon: '🏠' },
  { to: '/recipes',     label: 'Recipes',     icon: '📖' },
  { to: '/ingredients', label: 'Pantry',      icon: '🧅' },
  { to: '/suggestions', label: 'Suggest',     icon: '✨' },
  { to: '/history',     label: 'History',     icon: '📅' },
]

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-parchment-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 group">
            <span className="text-xl">🍳</span>
            <span className="font-display text-xl text-nook-dark group-hover:text-ember-500 transition-colors">
              CookNook
            </span>
          </NavLink>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-nook-muted font-mono">
              <span>{SEASON_EMOJI[season]}</span>
              <span className="capitalize">{season}</span>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-nook-muted hover:text-nook-ink transition-colors font-body"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      {/* Bottom nav (mobile-friendly) */}
      <nav className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-sm border-t border-parchment-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-around h-14">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-xs font-body
                 ${isActive
                   ? 'text-nook-dark font-medium'
                   : 'text-nook-muted hover:text-nook-ink'}`
              }
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
