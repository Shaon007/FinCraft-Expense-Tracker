import { useState } from 'react'
import Header from '@/components/common/Header'
import BalanceSummary from '@/components/dashboard/BalanceSummary'
import AccountsQuickRow from '@/components/dashboard/AccountsQuickRow'
import DpsQuickCard from '@/components/dashboard/DpsQuickCard'
import AllBalancesModal from '@/components/dashboard/AllBalancesModal'
import AddDepositModal from '@/components/deposits/AddDepositModal'
import DebtItemCard from '@/components/debt/DebtItemCard'
import CurrencyTicker from '@/components/dashboard/CurrencyTicker'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import MetricCard from '@/components/common/MetricCard'
import SpendingRiskAlert from '@/components/ai/SpendingRiskAlert'
import CategoryBreakdown from '@/components/expenses/CategoryBreakdown'
import QuickActionModal from '@/components/common/QuickActionModal'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { Plus, Landmark, CreditCard, ArrowRightLeft, TrendingUp, Smartphone, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { metrics, currency, transfers } = useFinance()
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showAllBalances, setShowAllBalances] = useState(false)
  const [showAddDeposit, setShowAddDeposit] = useState(false)
  const [addDepositType, setAddDepositType] = useState('mfs')
  const [showAddDebt, setShowAddDebt] = useState(false)

  const navigate = useNavigate()

  const handleOpenAddAccount = (type = 'mfs') => {
    setAddDepositType(type)
    setShowAddDeposit(true)
  }

  return (
    <div className="flex flex-col min-h-full w-full">
      <Header />

      {/* ─── Desktop: Two-column grid ──────────────────────────── */}
      <div className="flex-1 hidden lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 px-6 py-5 max-w-full">
        {/* Left column */}
        <div className="space-y-5 min-w-0">
          <BalanceSummary onOpenAllBalances={() => setShowAllBalances(true)} />

          {/* Accounts & Wallets Quick Row */}
          <AccountsQuickRow
            onOpenAdd={handleOpenAddAccount}
            onOpenAllBalances={() => setShowAllBalances(true)}
          />

          {/* Monthly DPS Schemes Card */}
          <DpsQuickCard onOpenAddDps={() => handleOpenAddAccount('dps')} />

          {/* Metric row */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Liquid Funds"
              value={formatCurrency(metrics.currentBalance, currency, true)}
              icon={Smartphone}
              gradient="from-pink-600 to-rose-700"
              subValue="Bank + MFS"
            />
            <MetricCard
              label="Total Savings & DPS"
              value={formatCurrency(metrics.totalSavings, currency, true)}
              icon={Target}
              gradient="from-cyan-600 to-blue-700"
              subValue="Accumulated"
            />
            <MetricCard
              label="Active Debt"
              value={formatCurrency(metrics.totalOwed, currency, true)}
              icon={CreditCard}
              gradient="from-danger-600 to-red-700"
              subValue="Remaining"
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
        <div className="space-y-5 min-w-0">
          <CurrencyTicker />
          <SpendingRiskAlert />
          <RecentTransactions limit={8} />
        </div>
      </div>

      {/* ─── Mobile: Single column ────────────────────────────── */}
      <div className="page-container flex-1 pt-3 lg:hidden space-y-4 w-full">
        <BalanceSummary onOpenAllBalances={() => setShowAllBalances(true)} />

        {/* Mobile Accounts & Wallets row */}
        <AccountsQuickRow
          onOpenAdd={handleOpenAddAccount}
          onOpenAllBalances={() => setShowAllBalances(true)}
        />

        {/* Monthly DPS Card */}
        <DpsQuickCard onOpenAddDps={() => handleOpenAddAccount('dps')} />

        <CurrencyTicker />

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Liquid Cash"
            value={formatCurrency(metrics.currentBalance, currency, true)}
            icon={Smartphone}
            gradient="from-pink-600 to-rose-700"
            subValue="Banks + MFS"
          />
          <MetricCard
            label="Active Debt"
            value={formatCurrency(metrics.totalOwed, currency, true)}
            icon={CreditCard}
            gradient="from-danger-600 to-red-700"
            subValue="Remaining"
          />
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

      {/* Modals */}
      {showQuickActions && (
        <QuickActionModal
          onClose={() => setShowQuickActions(false)}
          onAddAccount={handleOpenAddAccount}
        />
      )}

      {showAllBalances && (
        <AllBalancesModal
          onClose={() => setShowAllBalances(false)}
          onOpenAddAccount={handleOpenAddAccount}
          onOpenAddDebt={() => setShowAddDebt(true)}
        />
      )}

      {showAddDeposit && (
        <AddDepositModal
          initialType={addDepositType}
          onClose={() => setShowAddDeposit(false)}
        />
      )}

      {showAddDebt && (
        <DebtItemCard
          onClose={() => setShowAddDebt(false)}
        />
      )}
    </div>
  )
}
