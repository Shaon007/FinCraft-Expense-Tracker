import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { Target, Plus, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

export default function DpsQuickCard({ onOpenAddDps }) {
  const { metrics, currency, runDpsAutomation } = useFinance()
  const dpsList = metrics.dpsAccounts || []

  if (dpsList.length === 0) return null

  const now = new Date()
  const currentMonthKey = format(now, 'yyyy-MM')
  const currentDay = now.getDate()

  return (
    <div className="glass-card p-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-surface-800 to-indigo-950/20 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Target size={16} />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-1.5">
              Monthly DPS Schemes
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full font-sans">
                {dpsList.length} Ongoing
              </span>
            </h3>
            <p className="text-[11px] text-white/50">Fixed-date auto-savings from bKash</p>
          </div>
        </div>

        <button
          onClick={() => onOpenAddDps?.()}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg"
        >
          <Plus size={12} /> Add DPS
        </button>
      </div>

      {/* DPS items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {dpsList.map(dps => {
          const isCreditedThisMonth = dps.last_auto_debit_month === currentMonthKey
          const isPastDueDay = currentDay >= (dps.deposit_day || 1)

          return (
            <div key={dps.id} className="bg-surface-700/60 rounded-2xl p-3 border border-white/5 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-white truncate">{dps.bank_name}</p>
                  <p className="text-[11px] text-cyan-300 font-medium">
                    ৳{Number(dps.monthly_deposit || 0).toLocaleString()}/month
                  </p>
                </div>
                <div className="text-right">
                  <p className="amount-display text-sm font-bold text-white">
                    {formatCurrency(dps.balance, currency, true)}
                  </p>
                  <span className="text-[9px] text-white/40">Saved so far</span>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/5 text-white/50">
                <span className="truncate">
                  Source: <span className="text-pink-400 font-semibold">{dps.source_account_name || 'bKash'}</span> (Day {dps.deposit_day || 1})
                </span>

                {isCreditedThisMonth ? (
                  <span className="badge badge-success text-[9px] py-0 px-1.5 flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Paid
                  </span>
                ) : (
                  <span className="badge badge-brand text-[9px] py-0 px-1.5 flex items-center gap-0.5">
                    <Clock size={10} /> Due Day {dps.deposit_day || 1}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-white/50 text-[11px]">Total DPS Accumulated</span>
        <span className="amount-display font-bold text-cyan-300 text-sm">
          {formatCurrency(metrics.dpsBalance, currency, true)}
        </span>
      </div>
    </div>
  )
}
