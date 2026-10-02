import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { X, Building2, DollarSign, Percent, Calendar, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCOUNT_TYPES = [
  { key: 'savings',    label: 'Savings',    icon: '🏦' },
  { key: 'checking',   label: 'Checking',   icon: '💳' },
  { key: 'fd',         label: 'Fixed Dep.', icon: '🔒' },
  { key: 'mfs',        label: 'MFS',        icon: '📱' },
  { key: 'investment', label: 'Investment', icon: '📈' },
]

export default function AddDepositModal({ onClose }) {
  const { addDeposit } = useFinance()
  const [form, setForm] = useState({
    bank_name: '',
    account_type: 'savings',
    balance: '',
    interest_rate: '',
    account_number: '',
    maturity_date: '',
    notes: '',
    is_primary: false,
  })
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bank_name || !form.balance) { toast.error('Bank name and balance are required'); return }
    setLoading(true)
    try {
      await addDeposit({
        ...form,
        balance: parseFloat(form.balance),
        interest_rate: parseFloat(form.interest_rate || 0),
      })
      toast.success('Account added! 🏦')
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to add account')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 max-h-[90dvh] overflow-y-auto scrollbar-hide">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-white">Add Account</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div>
            <label className="label-text">Account Type</label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ACCOUNT_TYPES.map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => update('account_type', key)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border shrink-0 transition-all ${
                    form.account_type === key ? 'border-brand-500 bg-brand-500/15' : 'border-white/10 bg-surface-700'
                  }`}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-[10px] text-white/60 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">Bank / Institution *</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="deposit-bank" type="text" placeholder="e.g. Chase Bank" value={form.bank_name}
                onChange={e => update('bank_name', e.target.value)} className="input-field pl-9" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Balance *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="deposit-balance" type="number" step="0.01" placeholder="0.00" value={form.balance}
                  onChange={e => update('balance', e.target.value)} className="input-field pl-9" required />
              </div>
            </div>
            <div>
              <label className="label-text">Interest Rate %</label>
              <div className="relative">
                <Percent size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="deposit-rate" type="number" step="0.01" placeholder="0" value={form.interest_rate}
                  onChange={e => update('interest_rate', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
          </div>

          <div>
            <label className="label-text">Account Number (last 4 digits)</label>
            <div className="relative">
              <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="deposit-acct" type="text" maxLength={20} placeholder="Optional" value={form.account_number}
                onChange={e => update('account_number', e.target.value)} className="input-field pl-9" />
            </div>
          </div>

          {(form.account_type === 'fd' || form.account_type === 'investment') && (
            <div>
              <label className="label-text">Maturity Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input id="deposit-maturity" type="date" value={form.maturity_date}
                  onChange={e => update('maturity_date', e.target.value)} className="input-field pl-9 [color-scheme:dark]" />
              </div>
            </div>
          )}

          {/* Primary toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => update('is_primary', !form.is_primary)}
              className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center px-1 ${
                form.is_primary ? 'bg-brand-600' : 'bg-surface-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                form.is_primary ? 'translate-x-4' : ''
              }`} />
            </div>
            <span className="text-sm text-white/70">Set as primary account</span>
          </label>

          <button id="btn-submit-deposit" type="submit" disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-60' : ''}`}>
            {loading ? 'Saving...' : 'Add Account'}
          </button>
        </form>
      </div>
    </>
  )
}
