import { useState } from 'react'
import Header from '@/components/common/Header'
import BalanceSummary from '@/components/dashboard/BalanceSummary'
import CurrencyTicker from '@/components/dashboard/CurrencyTicker'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import MetricCard from '@/components/common/MetricCard'
import SpendingRiskAlert from '@/components/ai/SpendingRiskAlert'
import CategoryBreakdown from '@/components/expenses/CategoryBreakdown'
import QuickActionModal from '@/components/common/QuickActionModal'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { Plus, Landmark, CreditCard, ArrowRightLeft, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { metrics, currency, transfers } = useFinance()
  const [showQuickActions, setShowQuickActions] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full">
      <Header />

      {/* ─── Desktop: Two-column grid ──────────────────────────── */}
      <div className="flex-1 hidden lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 px-6 py-5">
        {/* Left column */}
        <div className="space-y-5 min-w-0">
          <BalanceSummary />

          {/* Metric row */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Total Savings"
              value={formatCurrency(metrics.totalSavings, currency, true)}
              icon={Landmark}
              gradient="from-brand-600 to-indigo-600"
              subValue="All accounts"
            />
            <MetricCard
              label="Active Debt"
              value={formatCurrency(metrics.totalOwed, currency, true)}
              icon={CreditCard}
              gradient="from-danger-600 to-red-700"
              subValue="Remaining"
            />
            <MetricCard
              label="Net Cash"
              value={formatCurrency(metrics.netCash, currency, true)}
              icon={TrendingUp}
              gradient="from-success-600 to-emerald-700"
              subValue="This month"
            />
          </div>

          {/* Category Breakdown */}
          <CategoryBreakdown />

          {/* Recent Transfers quick view */}
          {transfers.length > 0 && (
            <div className="glass-card overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="section-title">Recent Transfers</h3>
                <button onClick={() => navigate('/transfers')} className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                  See all →
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {transfers.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
                      <ArrowRightLeft size={14} className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 truncate">{t.from_account?.bank_name} → {t.to_account?.bank_name}</p>
                      <p className="text-xs text-white/40">{t.note || 'Transfer'} · {t.date}</p>
                    </div>
                    <span className="text-brand-400 font-bold amount-display">{formatCurrency(t.amount, currency, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <CurrencyTicker />
          <SpendingRiskAlert />
          <RecentTransactions limit={8} />
        </div>
      </div>

      {/* ─── Mobile: Single column ────────────────────────────── */}
      <div className="page-container flex-1 pt-4 lg:hidden space-y-4">
        <BalanceSummary />
        <CurrencyTicker />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Total Savings" value={formatCurrency(metrics.totalSavings, currency, true)} icon={Landmark} gradient="from-brand-600 to-indigo-600" subValue="All accounts" />
          <MetricCard label="Active Debt"   value={formatCurrency(metrics.totalOwed, currency, true)}    icon={CreditCard} gradient="from-danger-600 to-red-700"   subValue="Remaining" />
        </div>
        <SpendingRiskAlert />
        <RecentTransactions limit={5} />
      </div>

      {/* FAB (mobile only) */}
      <button
        id="btn-quick-actions"
        onClick={() => setShowQuickActions(true)}
        className="fixed lg:hidden right-4 w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow
                   flex items-center justify-center z-20 active:scale-95 transition-all duration-200"
        style={{ bottom: 'calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom)))' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showQuickActions && <QuickActionModal onClose={() => setShowQuickActions(false)} />}
    </div>
  )
}
