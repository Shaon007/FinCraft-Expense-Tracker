import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { X, Smartphone, Landmark, Target, ArrowUpRight, ArrowDownLeft, Plus, Check, Edit2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AllBalancesModal({ onClose, onOpenAddAccount, onOpenAddDebt }) {
  const { deposits, debts, metrics, currency, updateDepositBalance } = useFinance()
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal] = useState('')

  const handleStartEdit = (account) => {
    setEditingId(account.id)
    setEditVal(account.balance.toString())
  }

  const handleSaveEdit = async (account) => {
    if (!editVal || isNaN(parseFloat(editVal))) {
      toast.error('Please enter a valid amount')
      return
    }
    try {
      await updateDepositBalance(account.id, editVal)
      toast.success(`${account.bank_name} balance updated! ✅`)
      setEditingId(null)
    } catch {
      toast.error('Failed to update balance')
    }
  }

  const mfsList  = deposits.filter(d => d.account_type === 'mfs')
  const bankList = deposits.filter(d => ['savings', 'checking'].includes(d.account_type))
  const dpsList  = deposits.filter(d => d.account_type === 'dps')
  const loansGiven = debts.filter(d => d.direction === 'owed' && d.status === 'active')
  const loansTaken = debts.filter(d => d.direction === 'owe' && d.status === 'active')

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-4 sm:px-6 pt-5 max-h-[92dvh] overflow-y-auto scrollbar-hide max-w-2xl mx-auto">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-brand-400" size={20} />
              Balance & Assets Overview
            </h2>
            <p className="text-xs text-white/50">All your bank accounts, mobile wallets, DPS, and loans</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Hero Net Worth Card */}
        <div className="glass-card p-4 bg-gradient-to-r from-brand-600/30 via-indigo-600/30 to-purple-700/30 border border-brand-500/30 mb-5">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-xs text-white/60">Current Liquid Balance</p>
              <p className="amount-display text-2xl font-black text-white">{formatCurrency(metrics.currentBalance, currency, true)}</p>
              <p className="text-[10px] text-white/40">Bank + MFS Available</p>
            </div>
            <div>
              <p className="text-xs text-brand-300">Total Net Worth</p>
              <p className="amount-display text-2xl font-black text-brand-300">{formatCurrency(metrics.netWorth, currency, true)}</p>
              <p className="text-[10px] text-white/40">Assets minus Debts</p>
            </div>
          </div>
        </div>

        {/* ── 1. MOBILE BANKING ACCOUNTS (e.g. bKash, Nagad, Rocket) ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <Smartphone size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mobile Banking ({mfsList.length})</h3>
                <span className="text-[11px] text-white/40">Total: {formatCurrency(metrics.mfsBalance, currency, true)}</span>
              </div>
            </div>
            <button
              onClick={() => { onClose?.(); onOpenAddAccount?.('mfs') }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg"
            >
              <Plus size={13} /> Add Wallet
            </button>
          </div>

          <div className="space-y-2">
            {mfsList.map(acc => (
              <div key={acc.id} className="glass-card p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-surface-700 flex items-center justify-center text-lg shrink-0">
                    {acc.bank_name.toLowerCase().includes('bkash') ? '🌸' :
                     acc.bank_name.toLowerCase().includes('nagad') ? '🟠' :
                     acc.bank_name.toLowerCase().includes('rocket') ? '🟣' : '📱'}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-white truncate">{acc.bank_name}</p>
                    <p className="text-xs text-white/40">Mobile Wallet {acc.account_number ? `· ${acc.account_number}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId === acc.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className="w-24 px-2 py-1 text-sm bg-surface-700 border border-brand-500 text-white rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(acc)} className="w-7 h-7 bg-success-500 text-white rounded-lg flex items-center justify-center">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-7 h-7 bg-surface-700 text-white/50 rounded-lg flex items-center justify-center">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="amount-display text-base font-bold text-white">{formatCurrency(acc.balance, currency, true)}</span>
                      <button onClick={() => handleStartEdit(acc)} className="w-7 h-7 rounded-lg bg-surface-700 text-white/40 hover:text-white flex items-center justify-center transition-colors">
                        <Edit2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. BANK ACCOUNTS ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Landmark size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bank Accounts ({bankList.length})</h3>
                <span className="text-[11px] text-white/40">Total: {formatCurrency(metrics.bankBalance, currency, true)}</span>
              </div>
            </div>
            <button
              onClick={() => { onClose?.(); onOpenAddAccount?.('savings') }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg"
            >
              <Plus size={13} /> Add Bank
            </button>
          </div>

          <div className="space-y-2">
            {bankList.map(acc => (
              <div key={acc.id} className="glass-card p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-lg shrink-0">
                    🏦
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-white truncate">{acc.bank_name}</p>
                    <p className="text-xs text-white/40 capitalize">{acc.account_type} {acc.account_number ? `· ••${acc.account_number.slice(-4)}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId === acc.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className="w-24 px-2 py-1 text-sm bg-surface-700 border border-brand-500 text-white rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(acc)} className="w-7 h-7 bg-success-500 text-white rounded-lg flex items-center justify-center">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-7 h-7 bg-surface-700 text-white/50 rounded-lg flex items-center justify-center">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="amount-display text-base font-bold text-white">{formatCurrency(acc.balance, currency, true)}</span>
                      <button onClick={() => handleStartEdit(acc)} className="w-7 h-7 rounded-lg bg-surface-700 text-white/40 hover:text-white flex items-center justify-center transition-colors">
                        <Edit2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. MONTHLY DPS & SAVINGS SCHEMES ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Target size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Monthly DPS Schemes ({dpsList.length})</h3>
                <span className="text-[11px] text-cyan-400">Total Saved: {formatCurrency(metrics.dpsBalance, currency, true)}</span>
              </div>
            </div>
            <button
              onClick={() => { onClose?.(); onOpenAddAccount?.('dps') }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg"
            >
              <Plus size={13} /> Add DPS
            </button>
          </div>

          <div className="space-y-2">
            {dpsList.map(dps => (
              <div key={dps.id} className="glass-card p-3.5 space-y-2 border-l-2 border-cyan-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <div>
                      <p className="text-sm font-bold text-white">{dps.bank_name}</p>
                      <p className="text-xs text-cyan-300">
                        ৳{Number(dps.monthly_deposit || 0).toLocaleString()}/month · Due Day {dps.deposit_day || 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="amount-display text-base font-bold text-white">{formatCurrency(dps.balance, currency, true)}</p>
                    <span className="text-[10px] text-white/40">Accumulated</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 text-white/50">
                  <span>Auto-debit from: <strong className="text-pink-400">{dps.source_account_name || 'bKash'}</strong></span>
                  {dps.interest_rate > 0 && <span className="text-success-400">+{dps.interest_rate}% profit</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. LOANS GIVEN & LOANS TAKEN ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-bold text-white">Loans & Liabilities</h3>
            <button
              onClick={() => { onClose?.(); onOpenAddDebt?.() }}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg"
            >
              <Plus size={13} /> Add Loan
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="glass-card p-3 border-l-2 border-success-500">
              <div className="flex items-center gap-1 text-success-400 text-xs font-semibold mb-1">
                <ArrowDownLeft size={13} />
                <span>Loans Given (Asset)</span>
              </div>
              <p className="amount-display text-lg font-bold text-white">{formatCurrency(metrics.totalOwedToMe, currency, true)}</p>
              <p className="text-[10px] text-white/40">Money people owe you</p>
            </div>

            <div className="glass-card p-3 border-l-2 border-danger-500">
              <div className="flex items-center gap-1 text-danger-400 text-xs font-semibold mb-1">
                <ArrowUpRight size={13} />
                <span>Loans Taken (Debt)</span>
              </div>
              <p className="amount-display text-lg font-bold text-danger-400">{formatCurrency(metrics.totalOwed, currency, true)}</p>
              <p className="text-[10px] text-white/40">Money you owe others</p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full btn-secondary text-sm py-2.5">
          Done
        </button>
      </div>
    </>
  )
}
