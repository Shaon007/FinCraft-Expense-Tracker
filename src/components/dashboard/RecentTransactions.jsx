import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sanitizeCategoryIcon } from '@/lib/categories'

export default function RecentTransactions({ limit = 5 }) {
  const { transactions, currency } = useFinance()
  const navigate = useNavigate()
  const recent = transactions.slice(0, limit)

  if (!recent.length) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-white/50 text-sm">No transactions yet</p>
        <p className="text-white/30 text-xs mt-1">Add your first expense above</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 pt-4 pb-2 section-header">
        <h3 className="section-title">Recent Transactions</h3>
        <button
          className="text-xs text-brand-400 font-medium flex items-center gap-1 hover:text-brand-300"
          onClick={() => navigate('/expenses')}
        >
          See all <ArrowRight size={12} />
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {recent.map((tx) => {
          const isIncome = tx.type === 'income'
          const cat = tx.category || { name: 'Other', icon: '📦', color: '#6B7280' }
          const icon = sanitizeCategoryIcon(cat.name, cat.icon)
          return (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {tx.description || cat.name}
                </p>
                <p className="text-xs text-white/40">
                  {cat.name} · {format(new Date(tx.date + 'T00:00:00'), 'MMM d')}
                </p>
              </div>

              {/* Amount */}
              <div className={`flex items-center gap-1 shrink-0 ${isIncome ? 'text-success-400' : 'text-white'}`}>
                {isIncome ? <TrendingUp size={12} /> : <TrendingDown size={12} className="text-danger-400" />}
                <span className="amount-display text-sm font-bold">
                  {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
