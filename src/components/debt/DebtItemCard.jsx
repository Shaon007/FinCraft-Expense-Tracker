import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { X, User, DollarSign, Calendar, Percent, FileText, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DebtItemCard({ onClose, debt = null }) {
  const { addDebt, updateDebt } = useFinance()
  const isEditing = !!debt

  const [form, setForm] = useState({
    debtor_name: debt?.debtor_name || '',
    label: debt?.label || '',
    direction: debt?.direction || 'owe',
    principal: debt?.principal ? debt.principal.toString() : '',
    remaining: debt?.remaining !== undefined && debt?.remaining !== null ? debt.remaining.toString() : '',
    interest_rate: debt?.interest_rate ? debt.interest_rate.toString() : '',
    due_date: debt?.due_date || '',
    notes: debt?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.debtor_name.trim()) {
      toast.error('Please enter person or institution name')
      return
    }
    if (!form.principal || isNaN(parseFloat(form.principal)) || parseFloat(form.principal) <= 0) {
      toast.error('Please enter a valid loan amount')
      return
    }

    const principalNum = parseFloat(form.principal)
    const remainingNum = form.remaining !== '' && !isNaN(parseFloat(form.remaining))
      ? parseFloat(form.remaining)
      : principalNum

    const payload = {
      debtor_name: form.debtor_name.trim(),
      label: form.label.trim() || (form.direction === 'owe' ? 'Loan Taken' : 'Loan Given'),
      direction: form.direction,
      principal: principalNum,
      remaining: remainingNum,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : 0,
      due_date: form.due_date ? form.due_date : null,
      notes: form.notes?.trim() || null,
      status: remainingNum <= 0 ? 'paid' : 'active',
    }

    setLoading(true)
    try {
      if (isEditing) {
        await updateDebt(debt.id, payload)
        toast.success('Debt updated successfully! ✅')
      } else {
        await addDebt(payload)
        toast.success(form.direction === 'owe' ? 'Debt recorded! 📋' : 'Loan given recorded! 🤝')
      }
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save debt record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 max-h-[92dvh] overflow-y-auto scrollbar-hide max-w-lg mx-auto">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white">
              {isEditing ? 'Edit Debt / Loan' : 'Add Debt / Loan'}
            </h2>
            <p className="text-xs text-white/50">
              {form.direction === 'owe' ? 'Money you borrowed' : 'Money you lent to someone'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Direction toggle */}
        <div className="flex bg-surface-700 rounded-xl p-1 mb-4">
          {[
            { key: 'owe',  label: 'I Owe (Loan Taken)', color: 'bg-danger-500' },
            { key: 'owed', label: 'Owed to Me (Loan Given)', color: 'bg-success-500' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => update('direction', key)}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                form.direction === key ? `${color} text-white shadow-sm` : 'text-white/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Person / Creditor Name (Prominent & Required) */}
          <div>
            <label className="label-text">
              {form.direction === 'owe' ? "Lender / Person You Owe *" : "Borrower / Person's Name *"}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="debt-person"
                type="text"
                placeholder="e.g. Rahim Uddin, BRAC Bank"
                value={form.debtor_name}
                onChange={e => update('debtor_name', e.target.value)}
                className="input-field pl-9 text-base font-semibold"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Loan Reason / Tag (Optional) */}
          <div>
            <label className="label-text">Reason / Description (Optional)</label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="debt-label"
                type="text"
                placeholder="e.g. Lunch money, Car loan, Emergency"
                value={form.label}
                onChange={e => update('label', e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>

          {/* Amount and Remaining (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Total Loan Amount (৳) *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="debt-principal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.principal}
                  onChange={e => update('principal', e.target.value)}
                  className="input-field pl-9 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text">Amount Left (Optional)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="debt-remaining"
                  type="number"
                  step="0.01"
                  placeholder="Same as total"
                  value={form.remaining}
                  onChange={e => update('remaining', e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>

          {/* Interest Rate and Due Date (Both Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Interest Rate % (Optional)</label>
              <div className="relative">
                <Percent size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="debt-interest"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={form.interest_rate}
                  onChange={e => update('interest_rate', e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Due Date (Optional)</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="debt-due"
                  type="date"
                  value={form.due_date}
                  onChange={e => update('due_date', e.target.value)}
                  className="input-field pl-9 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="label-text">Notes (Optional)</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3.5 text-white/40" />
              <textarea
                id="debt-notes"
                rows={2}
                placeholder="Any additional notes or conditions..."
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                className="input-field pl-9 resize-none"
              />
            </div>
          </div>

          <button
            id="btn-submit-debt"
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${
              form.direction === 'owe' ? '' : 'bg-success-gradient'
            } ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Record' : 'Save Record'}
          </button>
        </form>
      </div>
    </>
  )
}
