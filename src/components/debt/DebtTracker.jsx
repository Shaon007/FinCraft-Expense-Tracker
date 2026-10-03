import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { Pencil, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import DebtItemCard from './DebtItemCard'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  active:  { label: 'Active',  icon: Clock,        className: 'badge-brand'   },
  paid:    { label: 'Paid',    icon: CheckCircle,  className: 'badge-success' },
  overdue: { label: 'Overdue', icon: AlertCircle,  className: 'badge-danger'  },
}

export default function DebtTracker({ onEdit }) {
  const { debts, updateDebt, deleteDebt, currency } = useFinance()
  const [tab, setTab] = useState('owe')
  const [editingDebt, setEditingDebt] = useState(null)

  const filtered = debts.filter(d => d.direction === tab)
  const totalOwed    = debts.filter(d => d.direction === 'owe'  && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)
  const totalOwedToMe= debts.filter(d => d.direction === 'owed' && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)

  const handleMarkPaid = async (debt) => {
    try {
      await updateDebt(debt.id, { status: 'paid', remaining: 0 })
      toast.success(`Marked "${debt.debtor_name}" as paid! ✅`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove the record for "${name}"?`)) return
    try {
      await deleteDebt(id)
      toast.success('Debt removed')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleStartEdit = (debt) => {
    if (onEdit) {
      onEdit(debt)
    } else {
      setEditingDebt(debt)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 border-l-2 border-danger-500">
          <p className="text-xs text-white/50 mb-1">Total I Owe</p>
          <div className="amount-display text-xl font-bold text-danger-400">
            {formatCurrency(totalOwed, currency, true)}
          </div>
        </div>
        <div className="glass-card p-4 border-l-2 border-success-500">
          <p className="text-xs text-white/50 mb-1">Owed to Me</p>
          <div className="amount-display text-xl font-bold text-success-400">
            {formatCurrency(totalOwedToMe, currency, true)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-700 rounded-xl p-1">
        {[
          { key: 'owe',  label: "I Owe (Loans Taken)", color: 'bg-danger-500'  },
          { key: 'owed', label: "Owed to Me (Loans Given)", color: 'bg-success-500' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              tab === key ? `${color} text-white shadow-sm` : 'text-white/50'
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
            {tab === 'owe' ? "You're debt free! No loans to pay." : "Nobody owes you money right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(debt => {
            const status = STATUS_CONFIG[debt.status] || STATUS_CONFIG.active
            const StatusIcon = status.icon
            const hasPartialRepayment = Number(debt.remaining) < Number(debt.principal) && debt.status !== 'paid'
            const progress = debt.principal > 0 ? ((debt.principal - debt.remaining) / debt.principal) * 100 : 0
            const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && debt.status !== 'paid'

            return (
              <div key={debt.id} className={`glass-card p-4 ${isOverdue ? 'border-danger-500/30' : ''}`}>
                {/* Top row: Person Name is BOLD and prominent */}
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-base text-white truncate">
                      {debt.debtor_name}
                    </h4>
                    {debt.label && (
                      <p className="text-xs text-white/50 truncate mt-0.5">{debt.label}</p>
                    )}
                  </div>
                  <span className={`${status.className} shrink-0`}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>

                {/* Amounts: Only show 'left of' if partial payment has occurred */}
                {hasPartialRepayment ? (
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="amount-display text-2xl font-black text-white">
                        {formatCurrency(debt.remaining, currency, true)}
                      </span>
                      <span className="text-xs text-white/40">
                        left of {formatCurrency(debt.principal, currency, true)}
                      </span>
                    </div>

                    {/* Progress bar */}
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
                ) : (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="amount-display text-2xl font-black text-white">
                      {formatCurrency(debt.status === 'paid' ? 0 : debt.principal, currency, true)}
                    </span>
                    {debt.status === 'paid' && (
                      <span className="text-xs text-success-400 font-medium">Fully Paid</span>
                    )}
                  </div>
                )}

                {/* Notes if present */}
                {debt.notes && (
                  <p className="text-xs text-white/60 bg-surface-700/50 rounded-lg px-2.5 py-1.5 mb-2.5">
                    {debt.notes}
                  </p>
                )}

                {/* Meta + Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                  <div className="flex items-center gap-3 text-xs text-white/40 min-w-0 truncate">
                    {debt.interest_rate > 0 && <span>📈 {debt.interest_rate}%</span>}
                    {debt.due_date && (
                      <span className={isOverdue ? 'text-danger-400 font-medium' : ''}>
                        📅 {format(new Date(debt.due_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {debt.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(debt)}
                        className="text-xs text-success-400 bg-success-500/10 px-2.5 py-1 rounded-lg 
                                   hover:bg-success-500/20 transition-colors font-medium"
                      >
                        Mark Paid
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(debt)}
                      className="w-7 h-7 rounded-lg bg-surface-700 text-white/50 hover:text-white flex items-center justify-center transition-colors"
                      title="Edit record"
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(debt.id, debt.debtor_name)}
                      className="w-7 h-7 rounded-lg bg-danger-500/10 flex items-center justify-center 
                                 text-danger-400 hover:bg-danger-500/20 transition-colors"
                      title="Delete record"
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

      {/* Internal modal if rendered standalone */}
      {editingDebt && (
        <DebtItemCard
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
        />
      )}
    </div>
  )
}
