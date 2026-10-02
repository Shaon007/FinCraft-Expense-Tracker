import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { X, User, DollarSign, Calendar, Percent } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DebtItemCard({ onClose }) {
  const { addDebt } = useFinance()
  const [form, setForm] = useState({
    label: '',
    debtor_name: '',
    direction: 'owe',
    principal: '',
    remaining: '',
    interest_rate: '',
    due_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.label || !form.debtor_name || !form.principal) {
      toast.error('Please fill required fields')
      return
    }
    setLoading(true)
    try {
      await addDebt({
        ...form,
        principal: parseFloat(form.principal),
        remaining: parseFloat(form.remaining || form.principal),
        interest_rate: parseFloat(form.interest_rate || 0),
      })
      toast.success('Debt added! 📋')
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to add debt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 max-h-[92dvh] overflow-y-auto scrollbar-hide">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-white">Add Debt</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50">
            <X size={16} />
          </button>
        </div>

        {/* Direction toggle */}
        <div className="flex bg-surface-700 rounded-xl p-1 mb-5">
          {[
            { key: 'owe',  label: 'I Owe', color: 'bg-danger-500' },
            { key: 'owed', label: 'Owed to Me', color: 'bg-success-500' },
          ].map(({ key, label, color }) => (
            <button key={key} type="button" onClick={() => update('direction', key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${form.direction === key ? `${color} text-white` : 'text-white/50'}`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Debt Label *</label>
            <input id="debt-label" type="text" placeholder="e.g. Car Loan, Personal Loan" value={form.label}
              onChange={e => update('label', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label-text">{form.direction === 'owe' ? 'Creditor Name' : 'Debtor Name'} *</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="debt-person" type="text" placeholder="Person or institution" value={form.debtor_name}
                onChange={e => update('debtor_name', e.target.value)} className="input-field pl-9" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Total Amount *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="debt-principal" type="number" step="0.01" placeholder="0.00" value={form.principal}
                  onChange={e => update('principal', e.target.value)} className="input-field pl-9" required />
              </div>
            </div>
            <div>
              <label className="label-text">Remaining</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="debt-remaining" type="number" step="0.01" placeholder="Same as total" value={form.remaining}
                  onChange={e => update('remaining', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Interest Rate %</label>
              <div className="relative">
                <Percent size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="debt-interest" type="number" step="0.01" placeholder="0" value={form.interest_rate}
                  onChange={e => update('interest_rate', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label-text">Due Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="debt-due" type="date" value={form.due_date}
                  onChange={e => update('due_date', e.target.value)} className="input-field pl-9 [color-scheme:dark]" />
              </div>
            </div>
          </div>
          <div>
            <label className="label-text">Notes</label>
            <textarea id="debt-notes" rows={2} placeholder="Additional notes..." value={form.notes}
              onChange={e => update('notes', e.target.value)} className="input-field resize-none" />
          </div>
          <button id="btn-submit-debt" type="submit" disabled={loading}
            className={`w-full btn-primary ${form.direction === 'owe' ? '' : 'bg-success-gradient'} ${loading ? 'opacity-60' : ''}`}>
            {loading ? 'Saving...' : 'Add Debt Record'}
          </button>
        </form>
      </div>
    </>
  )
}
