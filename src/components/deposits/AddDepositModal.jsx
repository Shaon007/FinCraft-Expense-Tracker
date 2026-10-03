import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { X, Building2, DollarSign, Percent, Calendar, Hash, Target, Smartphone, Landmark, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCOUNT_TYPES = [
  { key: 'mfs',        label: 'Mobile Banking', icon: '📱', desc: 'bKash, Nagad, Rocket' },
  { key: 'savings',    label: 'Bank Account',   icon: '🏦', desc: 'City, BRAC, EBL, etc.' },
  { key: 'dps',        label: 'Monthly DPS',    icon: '🎯', desc: 'Recurring Deposit Scheme' },
  { key: 'fd',         label: 'Fixed Deposit',  icon: '🔒', desc: 'Term deposit / FDR' },
  { key: 'checking',   label: 'Current Acct',   icon: '💳', desc: 'Checking / Business' },
]

const QUICK_PRESETS = [
  { name: 'bKash',     type: 'mfs',     icon: '🌸', color: 'border-pink-500/40 bg-pink-500/10' },
  { name: 'Nagad',     type: 'mfs',     icon: '🟠', color: 'border-orange-500/40 bg-orange-500/10' },
  { name: 'Rocket',    type: 'mfs',     icon: '🟣', color: 'border-purple-500/40 bg-purple-500/10' },
  { name: 'City Bank', type: 'savings', icon: '🏦', color: 'border-blue-500/40 bg-blue-500/10' },
  { name: 'BRAC Bank', type: 'savings', icon: '🏦', color: 'border-emerald-500/40 bg-emerald-500/10' },
  { name: 'Monthly DPS', type: 'dps',   icon: '🎯', color: 'border-cyan-500/40 bg-cyan-500/10' },
]

export default function AddDepositModal({ onClose, initialType = 'mfs' }) {
  const { addDeposit, deposits } = useFinance()
  const [form, setForm] = useState({
    bank_name: initialType === 'dps' ? 'Monthly DPS' : '',
    account_type: initialType,
    balance: '',
    monthly_deposit: '',
    deposit_day: '5',
    source_account_id: '',
    interest_rate: '',
    account_number: '',
    maturity_date: '',
    notes: '',
    is_primary: false,
  })
  const [loading, setLoading] = useState(false)

  // Find source accounts eligible for DPS auto-debit (like bKash or Bank)
  const debitSourceAccounts = deposits.filter(d => ['mfs', 'savings', 'checking'].includes(d.account_type))

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleApplyPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      bank_name: preset.name === 'Monthly DPS' ? 'Monthly DPS Scheme' : preset.name,
      account_type: preset.type,
      source_account_id: preset.type === 'dps' ? (debitSourceAccounts[0]?.id || '') : prev.source_account_id,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bank_name || form.balance === '') {
      toast.error('Account name and balance are required')
      return
    }

    if (form.account_type === 'dps' && !form.monthly_deposit) {
      toast.error('Please enter the monthly installment amount for DPS')
      return
    }

    setLoading(true)
    try {
      const sourceAcc = debitSourceAccounts.find(d => d.id === form.source_account_id)
      const payload = {
        bank_name: form.bank_name.trim(),
        account_type: form.account_type,
        balance: parseFloat(form.balance || 0),
        interest_rate: parseFloat(form.interest_rate || 0),
        account_number: form.account_number?.trim() || null,
        notes: form.notes?.trim() || null,
        is_primary: form.account_type === 'dps' ? false : !!form.is_primary,
      }

      if (form.account_type === 'dps') {
        payload.monthly_deposit = parseFloat(form.monthly_deposit || 0)
        payload.deposit_day = parseInt(form.deposit_day || 5)
        payload.source_account_id = form.source_account_id || null
        payload.source_account_name = sourceAcc ? sourceAcc.bank_name : null
      }

      await addDeposit(payload)
      toast.success(
        form.account_type === 'dps'
          ? '🎯 Monthly DPS added with fixed-date auto credit!'
          : '🏦 Account added successfully!'
      )
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to add account')
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
              {form.account_type === 'dps' ? 'Add Monthly DPS Scheme' : 'Add Bank or Mobile Account'}
            </h2>
            <p className="text-xs text-white/50">Add your account and set starting balance</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* 1-Tap Quick Presets */}
        <div className="mb-4">
          <label className="label-text">Quick Presets</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                  form.bank_name.toLowerCase().includes(p.name.toLowerCase())
                    ? 'border-brand-400 bg-brand-500/20 text-white shadow-glow'
                    : `${p.color} text-white/80 hover:text-white`
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selector */}
          <div>
            <label className="label-text">Account Category</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.slice(0, 3).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update('account_type', key)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                    form.account_type === key
                      ? 'border-brand-500 bg-brand-500/20 text-white shadow-glow'
                      : 'border-white/10 bg-surface-700 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-semibold leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ACCOUNT_TYPES.slice(3).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update('account_type', key)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl border transition-all ${
                    form.account_type === key
                      ? 'border-brand-500 bg-brand-500/20 text-white shadow-glow'
                      : 'border-white/10 bg-surface-700 text-white/60 hover:text-white'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account / Scheme Name */}
          <div>
            <label className="label-text">
              {form.account_type === 'dps' ? 'DPS Scheme Name *' : 'Bank / Institution Name *'}
            </label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="deposit-bank"
                type="text"
                placeholder={
                  form.account_type === 'mfs' ? 'e.g. bKash, Nagad, Rocket' :
                  form.account_type === 'dps' ? 'e.g. City Bank 5-Yr DPS' :
                  'e.g. City Bank, BRAC Bank'
                }
                value={form.bank_name}
                onChange={e => update('bank_name', e.target.value)}
                className="input-field pl-9"
                required
              />
            </div>
          </div>

          {/* Current / Starting Balance */}
          <div>
            <label className="label-text">
              {form.account_type === 'dps' ? 'Current Accumulated DPS Balance (৳) *' : 'Current Account Balance (৳) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">৳</span>
              <input
                id="deposit-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.balance}
                onChange={e => update('balance', e.target.value)}
                className="input-field pl-9 text-base font-bold"
                required
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              Enter your current live balance in this account
            </p>
          </div>

          {/* SPECIFIC FIELDS FOR DPS */}
          {form.account_type === 'dps' && (
            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                <Target size={14} />
                <span>Monthly DPS Automation Settings</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Monthly Installment (৳) *</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 5000"
                    value={form.monthly_deposit}
                    onChange={e => update('monthly_deposit', e.target.value)}
                    className="input-field text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="label-text">Credit Day of Month</label>
                  <select
                    value={form.deposit_day}
                    onChange={e => update('deposit_day', e.target.value)}
                    className="select-field text-sm font-semibold"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Day {i + 1} of month</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source account for auto-debit */}
              <div>
                <label className="label-text">Auto-Debit Source Account</label>
                <select
                  value={form.source_account_id}
                  onChange={e => update('source_account_id', e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">Select source account (e.g. bKash)</option>
                  {debitSourceAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} ({acc.account_type.toUpperCase()}) - Balance: ৳{acc.balance}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-white/40 mt-1">
                  On the fixed date, FinCraft will automatically credit this DPS from your selected account
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Profit / Interest Rate %</label>
              <div className="relative">
                <Percent size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="deposit-rate"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.5"
                  value={form.interest_rate}
                  onChange={e => update('interest_rate', e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label-text">Acct Number (Optional)</label>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="deposit-acct"
                  type="text"
                  maxLength={20}
                  placeholder="e.g. 01700 or ••1234"
                  value={form.account_number}
                  onChange={e => update('account_number', e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>

          {/* Primary toggle */}
          {form.account_type !== 'dps' && (
            <label className="flex items-center gap-3 cursor-pointer select-none py-1">
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
              <span className="text-xs text-white/80">Set as primary wallet / account</span>
            </label>
          )}

          <button
            id="btn-submit-deposit"
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? 'Saving...' : form.account_type === 'dps' ? 'Create DPS Scheme' : 'Add Account & Balance'}
          </button>
        </form>
      </div>
    </>
  )
}
