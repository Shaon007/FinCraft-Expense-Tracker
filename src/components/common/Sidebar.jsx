import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Landmark, BrainCircuit, Wallet, Settings, Sparkles, LogOut, ArrowRightLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/expenses',  icon: CreditCard,      label: 'Expenses'    },
  { to: '/debts',     icon: Wallet,          label: 'Debts'       },
  { to: '/deposits',  icon: Landmark,        label: 'Savings'     },
  { to: '/transfers', icon: ArrowRightLeft,  label: 'Transfers'   },
  { to: '/advisor',   icon: BrainCircuit,    label: 'AI Advisor'  },
  { to: '/settings',  icon: Settings,        label: 'Settings'    },
]

export default function Sidebar() {
  const { profile, user, signOut } = useAuth()
  const { isDemoMode, metrics, currency } = useFinance()
  const navigate = useNavigate()
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="flex flex-col h-full bg-surface-800 border-r border-white/[0.06] overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-display font-black text-white leading-none">FinCraft</h1>
            <p className="text-[10px] text-white/40 mt-0.5 font-medium tracking-wide">WEALTH TRACKER</p>
          </div>
        </div>
      </div>

      {/* Net Worth quick stat */}
      <div className="mx-3 my-3 p-3.5 rounded-xl bg-brand-gradient/10 border border-brand-500/20 shrink-0">
        <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mb-1">Net Worth</p>
        <p className="text-xl font-display font-black text-white leading-none">
          {formatCurrency(metrics.netWorth, currency, true)}
        </p>
        {isDemoMode && <span className="text-[10px] text-gold-400 font-semibold">● DEMO MODE</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide py-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group select-none ${
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/25 shadow-glass'
                  : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`shrink-0 transition-all duration-200 ${isActive ? 'drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]' : ''}`}
                />
                <span className="text-sm font-medium">{label}</span>
                {label === 'AI Advisor' && (
                  <span className="ml-auto text-[9px] font-bold text-gold-400 bg-gold-500/15 px-1.5 py-0.5 rounded-md">AI</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/60 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-glow">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-snug">{displayName}</p>
            <p className="text-[10px] text-white/40 truncate">{isDemoMode ? 'Demo Mode' : (user?.email || 'Guest')}</p>
          </div>
          {user && (
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="w-7 h-7 rounded-lg bg-danger-500/10 text-danger-400 flex items-center justify-center
                         hover:bg-danger-500/20 transition-colors shrink-0"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
