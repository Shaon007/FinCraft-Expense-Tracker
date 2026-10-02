import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { Pencil, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  active:  { label: 'Active',  icon: Clock,        className: 'badge-brand'   },
  paid:    { label: 'Paid',    icon: CheckCircle,  className: 'badge-success' },
  overdue: { label: 'Overdue', icon: AlertCircle,  className: 'badge-danger'  },
}

export default function DebtTracker() {
  const { debts, updateDebt, deleteDebt, currency } = useFinance()
  const [tab, setTab] = useState('owe')

  const filtered = debts.filter(d => d.direction === tab)
  const totalOwed    = debts.filter(d => d.direction === 'owe'  && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)
  const totalOwedToMe= debts.filter(d => d.direction === 'owed' && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)

  const handleMarkPaid = async (debt) => {
    try {
      await updateDebt(debt.id, { status: 'paid', remaining: 0 })
      toast.success(`Marked "${debt.label}" as paid! ✅`)
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDebt(id)
      toast.success('Debt removed')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 border-l-2 border-danger-500">
          <p className="text-xs text-white/50 mb-1">I Owe</p>
          <div className="amount-display text-xl font-bold text-danger-400">{formatCurrency(totalOwed, currency, true)}</div>
        </div>
        <div className="glass-card p-4 border-l-2 border-success-500">
          <p className="text-xs text-white/50 mb-1">Owed to Me</p>
          <div className="amount-display text-xl font-bold text-success-400">{formatCurrency(totalOwedToMe, currency, true)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-700 rounded-xl p-1">
        {[
          { key: 'owe',  label: "I Owe",       color: 'bg-danger-500'  },
          { key: 'owed', label: 'Owed to Me',  color: 'bg-success-500' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              tab === key ? `${color} text-white` : 'text-white/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Debt cards */}
      {!filtered.length ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">{tab === 'owe' ? '🎉' : '💸'}</div>
          <p className="text-white/50 text-sm">
            {tab === 'owe' ? "You're debt free!" : "Nobody owes you"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(debt => {
            const status = STATUS_CONFIG[debt.status] || STATUS_CONFIG.active
            const StatusIcon = status.icon
            const progress = debt.principal > 0 ? ((debt.principal - debt.remaining) / debt.principal) * 100 : 0
            const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && debt.status !== 'paid'

            return (
              <div key={debt.id} className={`glass-card p-4 ${isOverdue ? 'border-danger-500/30' : ''}`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{debt.label}</p>
                    <p className="text-xs text-white/50">{debt.debtor_name}</p>
                  </div>
                  <span className={status.className}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="amount-display text-2xl font-black text-white">
                    {formatCurrency(debt.remaining, currency, true)}
                  </span>
                  <span className="text-xs text-white/40">
                    of {formatCurrency(debt.principal, currency, true)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        tab === 'owe' ? 'bg-danger-gradient' : 'bg-success-gradient'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">{progress.toFixed(0)}% repaid</p>
                </div>

                {/* Meta + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {debt.interest_rate > 0 && <span>📈 {debt.interest_rate}%</span>}
                    {debt.due_date && (
                      <span className={isOverdue ? 'text-danger-400' : ''}>
                        📅 {format(new Date(debt.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(debt)}
                        className="text-xs text-success-400 bg-success-500/10 px-2.5 py-1 rounded-lg 
                                   hover:bg-success-500/20 transition-colors font-medium"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="w-7 h-7 rounded-lg bg-danger-500/10 flex items-center justify-center 
                                 text-danger-400 hover:bg-danger-500/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
