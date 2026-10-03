import { X, TrendingDown, TrendingUp, Smartphone, Landmark, Target, ArrowRightLeft, HandCoins } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function QuickActionModal({ onClose, onAddAccount }) {
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    onClose?.()
    navigate(path)
  }

  const handleCustomAction = (type) => {
    onClose?.()
    if (onAddAccount) {
      onAddAccount(type)
    } else {
      navigate(`/deposits?add=true&type=${type}`)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="bottom-sheet px-5 pt-5 max-w-lg mx-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Quick Actions</h2>
            <p className="text-xs text-white/50">Add transactions, wallets, DPS, or loans</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
          {/* 1. Add Expense */}
          <button
            onClick={() => handleNavigate('/expenses?add=true')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-danger-600 to-rose-700 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingDown size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Add Expense</span>
          </button>

          {/* 2. Add Income (Manual Salary) */}
          <button
            onClick={() => handleNavigate('/expenses?add=true&type=income')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-success-600 to-emerald-700 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Add Income / Salary</span>
          </button>

          {/* 3. Add Bank or MFS */}
          <button
            onClick={() => handleCustomAction('mfs')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-pink-600 to-rose-800 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Add Bank / MFS</span>
          </button>

          {/* 4. Add Monthly DPS */}
          <button
            onClick={() => handleCustomAction('dps')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-cyan-600 to-blue-700 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Add Monthly DPS</span>
          </button>

          {/* 5. Transfer Funds */}
          <button
            onClick={() => handleNavigate('/transfers')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-brand-600 to-indigo-700 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRightLeft size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Transfer Money</span>
          </button>

          {/* 6. Loans Given / Taken */}
          <button
            onClick={() => handleNavigate('/debts?add=true')}
            className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl
                       bg-gradient-to-br from-amber-600 to-orange-700 shadow-card active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <HandCoins size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">Loan Given / Taken</span>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full btn-secondary flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <X size={15} />
          Close
        </button>
      </div>
    </>
  )
}
