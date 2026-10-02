import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { Trash2, Star, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCOUNT_TYPE_CONFIG = {
  savings:    { label: 'Savings',    icon: '🏦', color: '#7C3AED' },
  checking:   { label: 'Checking',   icon: '💳', color: '#3B82F6' },
  fd:         { label: 'Fixed Dep.', icon: '🔒', color: '#F59E0B' },
  mfs:        { label: 'MFS',        icon: '📱', color: '#10B981' },
  investment: { label: 'Investment', icon: '📈', color: '#EC4899' },
}

export default function BankDepositList() {
  const { deposits, deleteDeposit, updateDeposit, currency, metrics } = useFinance()

  const handleDelete = async (id) => {
    try { await deleteDeposit(id); toast.success('Account removed') }
    catch { toast.error('Failed to delete') }
  }

  const togglePrimary = async (deposit) => {
    try { await updateDeposit(deposit.id, { is_primary: !deposit.is_primary }) }
    catch { toast.error('Failed to update') }
  }

  if (!deposits.length) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">🏦</div>
        <p className="text-white/50 text-sm">No accounts added yet</p>
        <p className="text-white/30 text-xs mt-1">Track your bank accounts and investments</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Total savings banner */}
      <div className="glass-card p-4 bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/20">
        <p className="text-xs text-white/50 mb-1">Total Across All Accounts</p>
        <div className="amount-display text-2xl font-black text-white">
          {formatCurrency(metrics.totalSavings, currency, true)}
        </div>
        <p className="text-xs text-success-400 mt-1 flex items-center gap-1">
          <TrendingUp size={10} />
          Avg {(deposits.reduce((s, d) => s + Number(d.interest_rate), 0) / deposits.length || 0).toFixed(1)}% interest
        </p>
      </div>

      {deposits.map(dep => {
        const cfg = ACCOUNT_TYPE_CONFIG[dep.account_type] || ACCOUNT_TYPE_CONFIG.savings
        const yearlyInterest = (Number(dep.balance) * Number(dep.interest_rate)) / 100
        return (
          <div key={dep.id} className={`glass-card p-4 relative overflow-hidden ${dep.is_primary ? 'border-gold-500/30' : ''}`}>
            {dep.is_primary && (
              <div className="absolute top-0 right-0 bg-gold-gradient px-2.5 py-1 rounded-bl-xl">
                <span className="text-[10px] font-bold text-white">PRIMARY</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{dep.bank_name}</p>
                  <span className="badge badge-brand text-[10px]">{cfg.label}</span>
                </div>
                {dep.account_number && (
                  <p className="text-xs text-white/40 mt-0.5">••••{dep.account_number.slice(-4)}</p>
                )}
                {dep.maturity_date && (
                  <p className="text-xs text-white/40">
                    Matures: {format(new Date(dep.maturity_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="amount-display text-2xl font-black text-white">
                  {formatCurrency(dep.balance, currency, true)}
                </div>
                {dep.interest_rate > 0 && (
                  <p className="text-xs text-success-400 mt-0.5">
                    +{dep.interest_rate}% · ~{formatCurrency(yearlyInterest, currency, true)}/yr
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePrimary(dep)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    dep.is_primary ? 'bg-gold-500/20 text-gold-400' : 'bg-surface-600 text-white/30 hover:text-white/70'
                  }`}
                >
                  <Star size={14} fill={dep.is_primary ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleDelete(dep.id)}
                  className="w-8 h-8 rounded-lg bg-danger-500/10 flex items-center justify-center text-danger-400 hover:bg-danger-500/20 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
