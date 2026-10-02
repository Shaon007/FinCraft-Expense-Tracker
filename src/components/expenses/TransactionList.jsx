import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TransactionList() {
  const { transactions, deleteTransaction, currency } = useFinance()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = transactions.filter(tx => {
    const matchSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase()) ||
                        tx.category?.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || tx.type === filter
    return matchSearch && matchFilter
  })

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-3">
      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            id="search-transactions"
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex bg-surface-700 rounded-xl p-1 gap-1">
          {['all', 'expense', 'income'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {!filtered.length ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white/50 text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map(tx => {
              const isIncome = tx.type === 'income'
              const cat = tx.category || { name: 'Other', icon: '📦', color: '#6B7280' }
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 group hover:bg-white/[0.02] transition-colors">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description || cat.name}</p>
                    <p className="text-xs text-white/40">
                      {cat.name} · {format(new Date(tx.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 ${isIncome ? 'text-success-400' : 'text-danger-400'}`}>
                      {isIncome ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span className="amount-display text-sm font-bold">
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-danger-500/10 
                                 flex items-center justify-center text-danger-400 hover:bg-danger-500/20 
                                 transition-all duration-200 shrink-0"
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
  )
}
