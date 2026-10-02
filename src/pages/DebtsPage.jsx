import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import DebtTracker from '@/components/debt/DebtTracker'
import DebtItemCard from '@/components/debt/DebtItemCard'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { useSearchParams } from 'react-router-dom'
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DebtsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { metrics, currency, debts } = useFinance()

  const overdueCount = debts.filter(d => d.status === 'active' && d.due_date && new Date(d.due_date) < new Date()).length

  useEffect(() => {
    if (searchParams.get('add') === 'true') setShowAdd(true)
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Debt Tracker" subtitle="Manage what you owe and what's owed" />

      <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-6 px-6 py-5 flex-1">
        {/* Left: Summary panel */}
        <div className="space-y-4">
          <div className="glass-card p-5 border-l-2 border-danger-500">
            <p className="text-xs text-white/50 mb-1">Total I Owe</p>
            <div className="amount-display text-2xl font-black text-danger-400">{formatCurrency(metrics.totalOwed, currency, true)}</div>
          </div>
          <div className="glass-card p-5 border-l-2 border-success-500">
            <p className="text-xs text-white/50 mb-1">Owed to Me</p>
            <div className="amount-display text-2xl font-black text-success-400">{formatCurrency(metrics.totalOwedToMe, currency, true)}</div>
          </div>

          {overdueCount > 0 && (
            <div className="glass-card p-4 border border-danger-500/30 bg-danger-500/5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-danger-400" />
                <p className="text-sm font-semibold text-danger-400">Overdue Alert</p>
              </div>
              <p className="text-xs text-white/50">{overdueCount} debt{overdueCount > 1 ? 's' : ''} past due date</p>
            </div>
          )}

          <button
            onClick={() => setShowAdd(true)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Debt
          </button>
        </div>

        {/* Right: Debt tracker */}
        <div>
          <DebtTracker />
        </div>
      </div>

      {/* Mobile */}
      <div className="page-container flex-1 pt-4 lg:hidden">
        <DebtTracker />
      </div>

      <button
        id="btn-add-debt"
        onClick={() => setShowAdd(true)}
        className="fixed lg:hidden right-4 w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow
                   flex items-center justify-center z-20 active:scale-95 transition-all"
        style={{ bottom: 'calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom)))' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showAdd && <DebtItemCard onClose={() => { setShowAdd(false); setSearchParams({}) }} />}
    </div>
  )
}
