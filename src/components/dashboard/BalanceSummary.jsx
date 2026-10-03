import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet, SlidersHorizontal, Smartphone, Landmark, Target } from 'lucide-react'
import { format } from 'date-fns'

export default function BalanceSummary({ onOpenAllBalances }) {
  const { metrics, currency } = useFinance()
  const { currentBalance, netWorth, totalIncome, totalExpense, netCash, savingsRate, mfsBalance, bankBalance, dpsBalance } = metrics
  const [viewMode, setViewMode] = useState('current') // 'current' or 'networth'

  const month = format(new Date(), 'MMMM yyyy')
  const isPositive = netCash >= 0

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-4 sm:p-6 mb-4 text-white shadow-card w-full max-w-full min-w-0"
      style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #0EA5E9 100%)' }}
    >
      {/* Decorative blurs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-black/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-full min-w-0">
        {/* Top bar: Mode Toggle & Overview CTA */}
        <div className="flex items-center justify-between gap-1.5 mb-3 w-full max-w-full">
          <div className="flex bg-black/20 backdrop-blur-md rounded-xl p-0.5 border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('current')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'current'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Current Balance
            </button>
            <button
              onClick={() => setViewMode('networth')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'networth'
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Total Net Worth
            </button>
          </div>

          <button
            onClick={() => onOpenAllBalances?.()}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium transition-colors shrink-0"
            title="View breakdown across all banks, wallets and loans"
          >
            <SlidersHorizontal size={12} />
            <span className="hidden sm:inline">All Assets</span>
          </button>
        </div>

        {/* Hero Amount Display */}
        <div className="mb-2">
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
            {viewMode === 'current' ? 'Available Liquid Balance' : 'Total Financial Net Worth'}
          </p>
          <div className="amount-display text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mt-0.5">
            {formatCurrency(viewMode === 'current' ? currentBalance : netWorth, currency, true)}
          </div>
          <p className="text-[11px] text-white/60 mt-0.5">
            {viewMode === 'current'
              ? 'Ready across 3 Mobile Wallets & 2 Bank accounts'
              : 'Includes liquid funds, 2 ongoing DPS & loans'}
          </p>
        </div>

        {/* Quick balance breakdown pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide pt-1 overscroll-x-contain touch-pan-x w-full max-w-full min-w-0">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs shrink-0 border border-white/5">
            <Smartphone size={13} className="text-pink-300" />
            <span className="text-white/70 text-[11px]">MFS:</span>
            <span className="font-bold text-white text-[11px]">{formatCurrency(mfsBalance, currency, true)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs shrink-0 border border-white/5">
            <Landmark size={13} className="text-blue-300" />
            <span className="text-white/70 text-[11px]">Banks:</span>
            <span className="font-bold text-white text-[11px]">{formatCurrency(bankBalance, currency, true)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs shrink-0 border border-white/5">
            <Target size={13} className="text-cyan-300" />
            <span className="text-white/70 text-[11px]">DPS:</span>
            <span className="font-bold text-cyan-200 text-[11px]">{formatCurrency(dpsBalance, currency, true)}</span>
          </div>
        </div>

        {/* Income / Expense Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-success-500/30 flex items-center justify-center">
                <TrendingUp size={11} className="text-success-400" />
              </div>
              <span className="text-[11px] text-white/70 font-medium">Income ({month.slice(0, 3)})</span>
            </div>
            <div className="amount-display text-base sm:text-lg font-bold text-white">
              {formatCurrency(totalIncome, currency, true)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-danger-500/30 flex items-center justify-center">
                <TrendingDown size={11} className="text-danger-400" />
              </div>
              <span className="text-[11px] text-white/70 font-medium">Spent ({month.slice(0, 3)})</span>
            </div>
            <div className="amount-display text-base sm:text-lg font-bold text-white">
              {formatCurrency(totalExpense, currency, true)}
            </div>
          </div>
        </div>

        {/* Savings Rate Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-[11px] text-white/70">
              <Wallet size={11} />
              <span>Savings Rate</span>
            </div>
            <span className={`text-[11px] font-bold ${isPositive ? 'text-success-300' : 'text-danger-300'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
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
