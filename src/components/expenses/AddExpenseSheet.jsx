import { useState, useMemo } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { useSearchParams } from 'react-router-dom'
import { X, DollarSign, Calendar, Tag, FileText } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sanitizeCategoryIcon } from '@/lib/categories'

export default function AddExpenseSheet({ onClose, defaultType = 'expense' }) {
  const { addTransaction, categories } = useFinance()
  const [searchParams] = useSearchParams()
  const typeFromUrl = searchParams.get('type') || defaultType

  // Filter categories by type
  const isIncomeCat = (c) => {
    const n = (c.name || '').toLowerCase()
    return c.type === 'income' || n.includes('salary') || n.includes('income') || n.includes('freelance') || n.includes('business') || n.includes('invest') || n.includes('bonus')
  }

  const [form, setForm] = useState(() => {
    const initialType = typeFromUrl
    const matchingCats = categories.filter(c => initialType === 'income' ? isIncomeCat(c) : !isIncomeCat(c))
    return {
      type: initialType,
      amount: '',
      category_id: (matchingCats[0] || categories[0])?.id || '',
      description: '',
      note: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  })
  const [loading, setLoading] = useState(false)

  const relevantCategories = useMemo(() => {
    const filtered = categories.filter(c => form.type === 'income' ? isIncomeCat(c) : !isIncomeCat(c))
    return filtered.length > 0 ? filtered : categories
  }, [categories, form.type])

  const handleTypeChange = (newType) => {
    const nextCats = categories.filter(c => newType === 'income' ? isIncomeCat(c) : !isIncomeCat(c))
    setForm(prev => ({
      ...prev,
      type: newType,
      category_id: (nextCats[0] || categories[0])?.id || '',
      description: '',
    }))
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    setLoading(true)
    try {
      await addTransaction({ ...form, amount: parseFloat(form.amount) })
      toast.success(`${form.type === 'income' ? 'Income' : 'Expense'} added! 🎉`)
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 max-h-[90dvh] overflow-y-auto scrollbar-hide">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-white">
            {form.type === 'income' ? 'Add Income' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50">
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex bg-surface-700 rounded-xl p-1 mb-5">
          {['expense', 'income'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
                form.type === t
                  ? t === 'expense'
                    ? 'bg-danger-500 text-white shadow-sm'
                    : 'bg-success-500 text-white shadow-sm'
                  : 'text-white/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="label-text">Amount (৳)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="input-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                className="input-field pl-9 text-xl font-bold"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-text mb-0">Select Category</label>
              <span className="text-[11px] text-white/40">
                {form.type === 'income' ? 'Income Categories' : 'Expense Categories'}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide py-1">
              {relevantCategories.map(cat => {
                const icon = sanitizeCategoryIcon(cat.name, cat.icon)
                const isSelected = form.category_id === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => update('category_id', cat.id)}
                    className={`flex flex-col items-center justify-center text-center p-2 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? form.type === 'income'
                          ? 'border-success-500 bg-success-500/20 text-white shadow-sm ring-1 ring-success-500'
                          : 'border-brand-500 bg-brand-500/20 text-white shadow-sm ring-1 ring-brand-500'
                        : 'border-white/10 bg-surface-700/80 text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl mb-1 select-none">{icon}</span>
                    <span className="text-[11px] font-medium leading-tight truncate w-full px-1">
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick descriptions for income */}
          {form.type === 'income' && (
            <div>
              <p className="text-[11px] text-white/40 mb-1.5">Quick Presets</p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {['Monthly Salary', 'Freelance Project', 'Business Profit', 'Bonus', 'Dividend'].map(txt => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => {
                      update('description', txt)
                      const matched = categories.find(c =>
                        (c.name || '').toLowerCase().includes(txt.toLowerCase().split(' ')[0])
                      )
                      if (matched) update('category_id', matched.id)
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg shrink-0 border transition-all ${
                      form.description === txt
                        ? 'bg-success-500/20 border-success-400 text-white font-semibold'
                        : 'bg-surface-700 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label-text">Description</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="input-description"
                type="text"
                placeholder={form.type === 'income' ? 'e.g. Monthly Salary' : 'What was this for?'}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label-text">Date</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="input-date"
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                className="input-field pl-9 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label-text">Note (optional)</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3.5 text-white/40" />
              <textarea
                id="input-note"
                placeholder="Any additional notes..."
                value={form.note}
                onChange={e => update('note', e.target.value)}
                rows={2}
                className="input-field pl-9 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-transaction"
            type="submit"
            disabled={loading}
            className={`w-full btn-primary flex items-center justify-center gap-2 ${
              form.type === 'expense' ? 'bg-danger-gradient' : 'bg-success-gradient'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ background: undefined }}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {loading ? 'Saving...' : `Save ${form.type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>
    </>
  )
}
