import { X, Plus, TrendingDown, TrendingUp, Landmark, BrainCircuit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ACTIONS = [
  { id: 'expense',  label: 'Add Expense',  icon: TrendingDown, gradient: 'from-danger-600 to-red-700',   to: '/expenses?add=true' },
  { id: 'income',   label: 'Add Income',   icon: TrendingUp,   gradient: 'from-success-600 to-green-700',to: '/expenses?add=true&type=income' },
  { id: 'deposit',  label: 'Add Savings',  icon: Landmark,     gradient: 'from-brand-600 to-indigo-700', to: '/deposits?add=true' },
  { id: 'advisor',  label: 'Ask AI',       icon: BrainCircuit, gradient: 'from-gold-500 to-amber-600',   to: '/advisor' },
]

export default function QuickActionModal({ onClose }) {
  const navigate = useNavigate()

  const handleAction = (to) => {
    onClose?.()
    navigate(to)
  }

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="bottom-sheet px-5 pt-5">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-white">Quick Actions</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTIONS.map(({ id, label, icon: Icon, gradient, to }) => (
            <button
              key={id}
              id={`quick-action-${id}`}
              onClick={() => handleAction(to)}
              className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl
                         bg-gradient-to-br ${gradient} shadow-card
                         active:scale-95 transition-all duration-200`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white">{label}</span>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </>
  )
}
