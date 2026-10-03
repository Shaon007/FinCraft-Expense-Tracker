import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { Plus, Edit2, Check, X, ArrowRightLeft, Smartphone, Landmark, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BRAND_THEMES = {
  bkash:  { bg: 'bg-[#E2136E]/15 border-[#E2136E]/30', text: 'text-[#F472B6]', badge: 'bKash', icon: '🌸' },
  nagad:  { bg: 'bg-[#F7941D]/15 border-[#F7941D]/30', text: 'text-[#FB923C]', badge: 'Nagad', icon: '🟠' },
  rocket: { bg: 'bg-[#8C3494]/15 border-[#8C3494]/30', text: 'text-[#C084FC]', badge: 'Rocket', icon: '🟣' },
  upay:   { bg: 'bg-[#0072BC]/15 border-[#0072BC]/30', text: 'text-[#38BDF8]', badge: 'Upay', icon: '🔵' },
}

export default function AccountsQuickRow({ onOpenAdd, onOpenAllBalances }) {
  const { deposits, currency, updateDepositBalance } = useFinance()
  const [editingId, setEditingId] = useState(null)
  const [tempVal, setTempVal] = useState('')
  const navigate = useNavigate()

  const liquidAccounts = deposits.filter(d => ['mfs', 'savings', 'checking', 'cash'].includes(d.account_type))

  const handleStartEdit = (e, acc) => {
    e.stopPropagation()
    setEditingId(acc.id)
    setTempVal(acc.balance.toString())
  }

  const handleSave = async (e, acc) => {
    e.stopPropagation()
    if (!tempVal || isNaN(parseFloat(tempVal))) {
      toast.error('Enter valid amount')
      return
    }
    try {
      await updateDepositBalance(acc.id, tempVal)
      toast.success(`${acc.bank_name} updated!`)
      setEditingId(null)
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="mb-4 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-2.5 px-0.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers size={15} className="text-brand-400 shrink-0" />
          <h3 className="text-sm font-display font-semibold text-white truncate">Accounts & Wallets</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenAllBalances?.()}
            className="text-[11px] sm:text-xs text-brand-400 hover:text-brand-300 font-medium whitespace-nowrap"
          >
            All <span className="hidden sm:inline">Balances</span> →
          </button>
          <button
            onClick={() => onOpenAdd?.('mfs')}
            className="text-xs bg-brand-gradient text-white font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-glow active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Horizontal scrolling accounts list */}
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide overscroll-x-contain touch-pan-x w-full max-w-full">
        {liquidAccounts.map(acc => {
          const lowerName = acc.bank_name.toLowerCase()
          const isBkash = lowerName.includes('bkash')
          const isNagad = lowerName.includes('nagad')
          const isRocket = lowerName.includes('rocket')
          const isMfs = acc.account_type === 'mfs'

          const theme = isBkash ? BRAND_THEMES.bkash :
                        isNagad ? BRAND_THEMES.nagad :
                        isRocket ? BRAND_THEMES.rocket :
                        null

          return (
            <div
              key={acc.id}
              className={`glass-card p-3 rounded-2xl shrink-0 w-36 sm:w-40 border relative group transition-all duration-200 hover:border-brand-500/30 ${
                theme ? theme.bg : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">
                  {theme ? theme.icon : acc.account_type === 'mfs' ? '📱' : '🏦'}
                </span>
                {editingId === acc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleSave(e, acc)}
                      className="w-5 h-5 bg-success-500 text-white rounded flex items-center justify-center"
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                      className="w-5 h-5 bg-surface-600 text-white/50 rounded flex items-center justify-center"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleStartEdit(e, acc)}
                    className="opacity-70 group-hover:opacity-100 text-white/40 hover:text-white p-1 rounded transition-opacity"
                    title="Edit balance"
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold text-white truncate mb-0.5">{acc.bank_name}</p>

              {editingId === acc.id ? (
                <input
                  type="number"
                  step="0.01"
                  value={tempVal}
                  onChange={e => setTempVal(e.target.value)}
                  className="w-full text-xs bg-surface-700 border border-brand-500 text-white rounded px-1.5 py-0.5 focus:outline-none"
                  autoFocus
                />
              ) : (
                <p className="amount-display text-sm font-bold text-white leading-tight">
                  {formatCurrency(acc.balance, currency, true)}
                </p>
              )}

              <p className="text-[10px] text-white/40 capitalize mt-1">
                {isMfs ? 'Mobile Banking' : acc.account_type}
              </p>
            </div>
          )
        })}

        {/* Add Card Shortcut */}
        <button
          onClick={() => onOpenAdd?.('mfs')}
          className="glass-card p-3 rounded-2xl shrink-0 w-28 sm:w-32 border border-dashed border-white/20
                     flex flex-col items-center justify-center gap-1 text-white/50 hover:text-white hover:border-brand-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center">
            <Plus size={16} className="text-brand-400" />
          </div>
          <span className="text-[11px] font-medium text-center leading-tight">Add Bank<br/>or Wallet</span>
        </button>
      </div>
    </div>
  )
}
