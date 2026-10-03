import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { Trash2, Star, TrendingUp, Edit2, Check, X, Smartphone, Landmark, Target, Shield, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCOUNT_TYPE_CONFIG = {
  mfs:        { label: 'Mobile Banking', icon: '📱', color: '#EC4899' },
  savings:    { label: 'Savings',        icon: '🏦', color: '#7C3AED' },
  dps:        { label: 'Monthly DPS',    icon: '🎯', color: '#06B6D4' },
  checking:   { label: 'Checking',       icon: '💳', color: '#3B82F6' },
  fd:         { label: 'Fixed Deposit',  icon: '🔒', color: '#F59E0B' },
  investment: { label: 'Investment',     icon: '📈', color: '#10B981' },
}

export default function BankDepositList({ onOpenAdd }) {
  const { deposits, deleteDeposit, updateDeposit, updateDepositBalance, currency, metrics } = useFinance()
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return
    try {
      await deleteDeposit(id)
      toast.success('Account removed')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const togglePrimary = async (deposit) => {
    try {
      await updateDeposit(deposit.id, { is_primary: !deposit.is_primary })
      toast.success(`Updated primary account`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleStartEdit = (dep) => {
    setEditingId(dep.id)
    setEditAmount(dep.balance.toString())
  }

  const handleSaveEdit = async (dep) => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      toast.error('Enter valid amount')
      return
    }
    try {
      await updateDepositBalance(dep.id, editAmount)
      toast.success(`${dep.bank_name} balance updated! ✅`)
      setEditingId(null)
    } catch {
      toast.error('Failed to save balance')
    }
  }

  if (!deposits.length) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-3">🏦</div>
        <p className="text-white/50 text-sm">No accounts added yet</p>
        <p className="text-white/30 text-xs mt-1">Add your mobile wallets, banks, and DPS</p>
        <button
          onClick={() => onOpenAdd?.('mfs')}
          className="btn-primary text-xs py-2 px-4 mt-3"
        >
          Add Your First Account
        </button>
      </div>
    )
  }

  const mfsAccounts  = deposits.filter(d => d.account_type === 'mfs')
  const bankAccounts = deposits.filter(d => ['savings', 'checking'].includes(d.account_type))
  const dpsAccounts  = deposits.filter(d => d.account_type === 'dps')
  const otherAccounts= deposits.filter(d => ['fd', 'investment'].includes(d.account_type))

  const renderAccountCard = (dep) => {
    const cfg = ACCOUNT_TYPE_CONFIG[dep.account_type] || ACCOUNT_TYPE_CONFIG.savings
    const isEditing = editingId === dep.id
    const isDPS = dep.account_type === 'dps'

    return (
      <div
        key={dep.id}
        className={`glass-card p-4 relative overflow-hidden transition-all duration-200 ${
          dep.is_primary ? 'border-brand-500/40 bg-brand-500/5' : 'hover:border-white/20'
        } ${isDPS ? 'border-l-4 border-l-cyan-400' : ''}`}
      >
        {dep.is_primary && (
          <div className="absolute top-0 right-0 bg-brand-gradient px-2.5 py-0.5 rounded-bl-xl text-[9px] font-bold text-white shadow-glow">
            PRIMARY
          </div>
        )}

        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${cfg.color}20` }}
          >
            {cfg.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white truncate text-sm sm:text-base">{dep.bank_name}</p>
              <span className="badge text-[10px] py-0 px-2" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>

            {isDPS ? (
              <p className="text-xs text-cyan-300 font-medium mt-0.5">
                ৳{Number(dep.monthly_deposit || 0).toLocaleString()}/month · Due Day {dep.deposit_day || 1}
                {dep.source_account_name && ` (from ${dep.source_account_name})`}
              </p>
            ) : (
              dep.account_number && (
                <p className="text-xs text-white/40 mt-0.5">Account ••{dep.account_number.slice(-4)}</p>
              )
            )}
          </div>
        </div>

        {/* Balance and Controls */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-end justify-between gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-white/40 mb-0.5">
              {isDPS ? 'Accumulated Balance' : 'Current Balance'}
            </p>

            {isEditing ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-white/60 font-bold text-sm">৳</span>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-28 px-2 py-1 text-sm bg-surface-700 border border-brand-500 rounded-lg text-white font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(dep)}
                  className="w-7 h-7 bg-success-500 text-white rounded-lg flex items-center justify-center shadow-sm"
                  title="Save balance"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="w-7 h-7 bg-surface-700 text-white/50 rounded-lg flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="amount-display text-xl sm:text-2xl font-black text-white">
                  {formatCurrency(dep.balance, currency, true)}
                </span>
                <button
                  onClick={() => handleStartEdit(dep)}
                  className="text-white/30 hover:text-white p-1 rounded-md hover:bg-surface-700 transition-colors"
                  title="Quick edit balance"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            {dep.interest_rate > 0 && !isEditing && (
              <p className="text-[11px] text-success-400 mt-0.5">
                +{dep.interest_rate}% annual return
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isDPS && (
              <button
                onClick={() => togglePrimary(dep)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  dep.is_primary ? 'bg-gold-500/20 text-gold-400' : 'bg-surface-700 text-white/30 hover:text-white/70'
                }`}
                title="Toggle primary"
              >
                <Star size={13} fill={dep.is_primary ? 'currentColor' : 'none'} />
              </button>
            )}
            <button
              onClick={() => handleDelete(dep.id, dep.bank_name)}
              className="w-8 h-8 rounded-lg bg-danger-500/10 flex items-center justify-center text-danger-400 hover:bg-danger-500/20 transition-colors"
              title="Delete account"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top Banner: Liquid vs Total */}
      <div className="glass-card p-4 bg-gradient-to-r from-brand-600/20 via-indigo-600/20 to-cyan-600/20 border border-brand-500/20">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-white/60">Current Liquid Funds</p>
            <p className="amount-display text-xl sm:text-2xl font-black text-white">
              {formatCurrency(metrics.currentBalance, currency, true)}
            </p>
            <p className="text-[10px] text-white/40">Bank + Mobile Banking</p>
          </div>
          <div>
            <p className="text-[11px] text-cyan-300">Total Savings & DPS</p>
            <p className="amount-display text-xl sm:text-2xl font-black text-cyan-300">
              {formatCurrency(metrics.dpsBalance + metrics.fdBalance, currency, true)}
            </p>
            <p className="text-[10px] text-white/40">{dpsAccounts.length} DPS Active</p>
          </div>
        </div>
      </div>

      {/* ── 1. MOBILE BANKING ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Smartphone size={15} className="text-pink-400" />
            <h3 className="text-sm font-bold text-white">Mobile Banking ({mfsAccounts.length})</h3>
          </div>
          <button
            onClick={() => onOpenAdd?.('mfs')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            <Plus size={12} /> Add Wallet
          </button>
        </div>
        <div className="space-y-2.5">
          {mfsAccounts.map(renderAccountCard)}
        </div>
      </div>

      {/* ── 2. BANK ACCOUNTS ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Landmark size={15} className="text-blue-400" />
            <h3 className="text-sm font-bold text-white">Bank Accounts ({bankAccounts.length})</h3>
          </div>
          <button
            onClick={() => onOpenAdd?.('savings')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            <Plus size={12} /> Add Bank
          </button>
        </div>
        <div className="space-y-2.5">
          {bankAccounts.map(renderAccountCard)}
        </div>
      </div>

      {/* ── 3. MONTHLY DPS SCHEMES ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target size={15} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Monthly DPS Schemes ({dpsAccounts.length})</h3>
          </div>
          <button
            onClick={() => onOpenAdd?.('dps')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <Plus size={12} /> Add DPS
          </button>
        </div>
        <div className="space-y-2.5">
          {dpsAccounts.map(renderAccountCard)}
        </div>
      </div>

      {/* ── 4. FIXED DEPOSITS & OTHER ── */}
      {otherAccounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield size={15} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Fixed Deposits & Term Savings</h3>
            </div>
          </div>
          <div className="space-y-2.5">
            {otherAccounts.map(renderAccountCard)}
          </div>
        </div>
      )}
    </div>
  )
}
