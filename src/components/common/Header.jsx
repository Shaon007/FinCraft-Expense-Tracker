import { Bell, Settings, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFinance } from '@/context/FinanceContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Header({ title, subtitle, showActions = true }) {
  const { profile, user } = useAuth()
  const { isDemoMode } = useFinance()
  const navigate = useNavigate()
  const location = useLocation()

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // On desktop with sidebar, the header becomes a top bar (no branding)
  const isHome = location.pathname === '/'

  return (
    <header
      className="sticky top-0 z-20 bg-surface-900/80 backdrop-blur-xl border-b border-white/5"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-full mx-auto px-4 lg:px-6 pb-3 flex items-center gap-3">
        {/* Back button (when not home and on mobile) */}
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Left: title / welcome */}
        <div className="flex-1 min-w-0">
          {title ? (
            <>
              <h1 className="text-lg font-display font-bold text-white truncate">{title}</h1>
              {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
            </>
          ) : (
            <div>
              <p className="text-xs text-white/40 font-medium lg:hidden">Welcome back 👋</p>
              <h1 className="text-base font-display font-bold text-white truncate lg:hidden">{displayName}</h1>
              {/* Desktop: just page label */}
              <h1 className="hidden lg:block text-xl font-display font-bold text-white">Dashboard</h1>
            </div>
          )}
        </div>

        {isDemoMode && (
          <span className="badge badge-warning text-[10px] shrink-0 hidden sm:inline-flex">DEMO</span>
        )}

        {showActions && (
          <div className="flex items-center gap-2">
            <button
              id="btn-notifications"
              className="w-9 h-9 rounded-xl bg-surface-700 flex items-center justify-center
                         border border-white/10 text-white/60 hover:text-white transition-colors"
            >
              <Bell size={16} />
            </button>
            <button
              id="btn-settings"
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center
                         text-white font-bold text-sm shadow-glow"
            >
              {initials || <Settings size={16} />}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
