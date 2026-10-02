import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { format } from 'date-fns'

export default function BalanceSummary() {
  const { metrics, currency } = useFinance()
  const { netWorth, totalIncome, totalExpense, netCash, savingsRate } = metrics

  const month = format(new Date(), 'MMMM yyyy')
  const isPositive = netCash >= 0

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 mb-4"
         style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #0EA5E9 100%)' }}>

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-xl" />

      <div className="relative z-10">
        {/* Net Worth */}
        <div className="mb-1">
          <p className="text-sm font-medium text-white/70 mb-1">Total Net Worth</p>
          <div className="amount-display text-4xl font-black text-white leading-none">
            {formatCurrency(netWorth, currency, true)}
          </div>
        </div>

        {/* Month */}
        <p className="text-xs text-white/50 mt-2 mb-5 font-medium">{month}</p>

        {/* Income / Expense row */}
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-success-500/30 flex items-center justify-center">
                <TrendingUp size={12} className="text-success-400" />
              </div>
              <span className="text-xs text-white/60 font-medium">Income</span>
            </div>
            <div className="amount-display text-lg font-bold text-white">
              {formatCurrency(totalIncome, currency, true)}
            </div>
          </div>

          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-danger-500/30 flex items-center justify-center">
                <TrendingDown size={12} className="text-danger-400" />
              </div>
              <span className="text-xs text-white/60 font-medium">Spent</span>
            </div>
            <div className="amount-display text-lg font-bold text-white">
              {formatCurrency(totalExpense, currency, true)}
            </div>
          </div>
        </div>

        {/* Savings rate bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wallet size={12} className="text-white/60" />
              <span className="text-xs text-white/60">Savings Rate</span>
            </div>
            <span className={`text-xs font-bold ${isPositive ? 'text-success-400' : 'text-danger-400'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-success-400' : 'bg-danger-400'}`}
              style={{ width: `${Math.min(savingsRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
