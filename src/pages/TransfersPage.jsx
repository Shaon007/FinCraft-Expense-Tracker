import { useState } from 'react'
import Header from '@/components/common/Header'
import TransferModal from '@/components/deposits/TransferModal'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { ArrowRightLeft, Plus, Trash2, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const ACCOUNT_ICONS = { savings: '🏦', checking: '💳', fd: '🔒', mfs: '📱', investment: '📈' }

export default function TransfersPage() {
  const { transfers, deposits, deleteTransfer, currency } = useFinance()
  const [showModal, setShowModal] = useState(false)

  const totalTransferred = transfers.reduce((s, t) => s + Number(t.amount), 0)

  // Monthly transfer volume for chart
  const monthlyData = (() => {
    const months = {}
    transfers.forEach(t => {
      const key = t.date?.slice(0, 7) || 'unknown'
      months[key] = (months[key] || 0) + Number(t.amount)
    })
    return Object.entries(months).slice(-6).map(([month, total]) => ({
      month: month.slice(5),
      total,
    }))
  })()

  const handleDelete = async (id) => {
    try { await deleteTransfer(id); toast.success('Transfer record removed') }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Transfers" subtitle="Move money between your accounts" />

      <div className="lg:grid lg:grid-cols-[1fr_340px] gap-6 lg:px-6 lg:py-5">
        {/* ─── Left / Main ─── */}
        <div className="page-container lg:p-0 lg:max-w-none space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <p className="text-xs text-white/50 mb-1">Total Transferred</p>
              <div className="amount-display text-xl font-black text-brand-300">
                {formatCurrency(totalTransferred, currency, true)}
              </div>
              <p className="text-xs text-white/30 mt-0.5">{transfers.length} transfer{transfers.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-white/50 mb-1">Accounts Linked</p>
              <div className="amount-display text-xl font-black text-white">{deposits.length}</div>
              <p className="text-xs text-white/30 mt-0.5">Ready to transfer</p>
            </div>
          </div>

          {/* Account quick view */}
          <div>
            <p className="label-text px-0.5 mb-2">Your Accounts</p>
            <div className="space-y-2">
              {deposits.map(dep => (
                <div key={dep.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="text-xl shrink-0">{ACCOUNT_ICONS[dep.account_type] || '🏦'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{dep.bank_name}</p>
                    <p className="text-xs text-white/40 capitalize">{dep.account_type}</p>
                  </div>
                  <div className="amount-display text-base font-bold text-white shrink-0">
                    {formatCurrency(dep.balance, currency, true)}
                  </div>
                </div>
              ))}
              {!deposits.length && (
                <div className="glass-card p-6 text-center">
                  <div className="text-3xl mb-2">🏦</div>
                  <p className="text-white/50 text-sm">Add accounts in Savings to enable transfers</p>
                </div>
              )}
            </div>
          </div>

          {/* Transfer history */}
          <div>
            <p className="label-text px-0.5 mb-2">Transfer History</p>
            {!transfers.length ? (
              <div className="glass-card p-8 text-center">
                <div className="text-4xl mb-3">↔️</div>
                <p className="text-white/50 text-sm">No transfers yet</p>
                <p className="text-white/30 text-xs mt-1">Use the + button to move money between accounts</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="divide-y divide-white/5">
                  {transfers.map(t => {
                    const fromAcc = t.from_account || deposits.find(d => d.id === t.from_account_id)
                    const toAcc   = t.to_account   || deposits.find(d => d.id === t.to_account_id)
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 group hover:bg-white/[0.02] transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center shrink-0">
                          <ArrowRightLeft size={16} className="text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                            <span className="truncate max-w-[80px]">{fromAcc?.bank_name || '?'}</span>
                            <ArrowRightLeft size={10} className="text-white/40 shrink-0" />
                            <span className="truncate max-w-[80px]">{toAcc?.bank_name || '?'}</span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            {t.note ? `${t.note} · ` : ''}{format(new Date(t.date + 'T00:00:00'), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="amount-display text-base font-bold text-brand-300">
                            {formatCurrency(t.amount, currency)}
                          </span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-danger-500/10
                                       flex items-center justify-center text-danger-400 hover:bg-danger-500/20 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right panel (desktop) ─── */}
        <div className="hidden lg:block space-y-5 py-5">
          {/* Transfer volume chart */}
          {monthlyData.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="section-title mb-4">Monthly Volume</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ background: '#1E1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      formatter={v => [formatCurrency(v, currency, true), 'Transferred']}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    />
                    <Bar dataKey="total" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Transfer CTA */}
          <div className="glass-card p-5 text-center border border-brand-500/20">
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient mx-auto mb-3 flex items-center justify-center shadow-glow">
              <ArrowRightLeft size={20} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Quick Transfer</p>
            <p className="text-xs text-white/40 mb-4">Move funds between your accounts instantly</p>
            <button
              onClick={() => setShowModal(true)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={16} /> New Transfer
            </button>
          </div>
        </div>
      </div>

      {/* FAB (mobile) */}
      <button
        id="btn-add-transfer"
        onClick={() => setShowModal(true)}
        className="fixed lg:hidden right-4 w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow
                   flex items-center justify-center z-20 active:scale-95 transition-all"
        style={{ bottom: 'calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom)))' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showModal && <TransferModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
