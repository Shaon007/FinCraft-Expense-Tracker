import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Landmark, BrainCircuit, Wallet, ArrowRightLeft } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home'      },
  { to: '/expenses',  icon: CreditCard,      label: 'Expenses'  },
  { to: '/transfers', icon: ArrowRightLeft,  label: 'Transfer'  },
  { to: '/deposits',  icon: Landmark,        label: 'Accounts'  },
  { to: '/advisor',   icon: BrainCircuit,    label: 'AI'        },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-surface-800/95 backdrop-blur-xl border-t border-white/5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 pt-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item flex-1 ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-brand-600/20' : ''}`}>
                  <Icon
                    size={21}
                    className={`transition-all duration-200 ${
                      isActive
                        ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]'
                        : 'text-white/40'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={`text-[9px] font-medium transition-all duration-200 ${isActive ? 'text-brand-400' : 'text-white/40'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
