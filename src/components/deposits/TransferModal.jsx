import { useState } from 'react'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { X, ArrowRightLeft, DollarSign, Calendar, FileText, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TransferModal({ onClose }) {
  const { deposits, transfers, addTransfer, currency } = useFinance()
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [loading, setLoading] = useState(false)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const fromAccount = deposits.find(d => d.id === form.from_account_id)
  const toAccount   = deposits.find(d => d.id === form.to_account_id)
  const canTransfer = form.from_account_id && form.to_account_id
                   && form.from_account_id !== form.to_account_id
                   && Number(form.amount) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canTransfer) { toast.error('Select different from/to accounts and enter an amount'); return }
    if (fromAccount && Number(form.amount) > Number(fromAccount.balance)) {
      toast.error(`Insufficient balance in ${fromAccount.bank_name}`)
      return
    }
    setLoading(true)
    try {
      await addTransfer({ ...form, amount: parseFloat(form.amount) })
      toast.success(`Transferred ${formatCurrency(form.amount, currency)} ✅`)
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const ACCOUNT_ICONS = { savings: '🏦', checking: '💳', fd: '🔒', mfs: '📱', investment: '📈' }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 max-h-[90dvh] overflow-y-auto scrollbar-hide lg:rounded-2xl lg:max-w-md lg:w-full lg:mx-auto lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:fixed">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 lg:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
              <ArrowRightLeft size={15} className="text-white" />
            </div>
            <h2 className="text-lg font-display font-bold text-white">Transfer Funds</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {deposits.length < 2 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏦</div>
            <p className="text-white/50 text-sm">Add at least 2 accounts to transfer between them</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From → To visual */}
            <div className="flex items-center gap-2">
              {/* From */}
              <div className="flex-1">
                <label className="label-text">From</label>
                <select
                  id="transfer-from"
                  value={form.from_account_id}
                  onChange={e => update('from_account_id', e.target.value)}
                  className="select-field text-sm"
                  required
                >
                  <option value="">Select account</option>
                  {deposits.map(d => (
                    <option key={d.id} value={d.id} disabled={d.id === form.to_account_id}>
                      {ACCOUNT_ICONS[d.account_type] || '🏦'} {d.bank_name} ({formatCurrency(d.balance, currency, true)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-5 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                  <ChevronRight size={16} className="text-white" />
                </div>
              </div>

              {/* To */}
              <div className="flex-1">
                <label className="label-text">To</label>
                <select
                  id="transfer-to"
                  value={form.to_account_id}
                  onChange={e => update('to_account_id', e.target.value)}
                  className="select-field text-sm"
                  required
                >
                  <option value="">Select account</option>
                  {deposits.map(d => (
                    <option key={d.id} value={d.id} disabled={d.id === form.from_account_id}>
                      {ACCOUNT_ICONS[d.account_type] || '🏦'} {d.bank_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview pill */}
            {fromAccount && toAccount && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-700/60 border border-white/5 text-xs text-white/60">
                <span className="font-semibold text-white">{fromAccount.bank_name}</span>
                <ArrowRightLeft size={11} className="text-brand-400 shrink-0" />
                <span className="font-semibold text-white">{toAccount.bank_name}</span>
                {fromAccount && (
                  <span className="ml-auto text-white/40">Avail: {formatCurrency(fromAccount.balance, currency, true)}</span>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="label-text">Amount</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => update('amount', e.target.value)}
                  className="input-field pl-9 text-xl font-bold"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="label-text">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  id="transfer-date"
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
                  id="transfer-note"
                  placeholder="Reason for transfer..."
                  value={form.note}
                  onChange={e => update('note', e.target.value)}
                  rows={2}
                  className="input-field pl-9 resize-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-transfer"
              type="submit"
              disabled={loading || !canTransfer}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                loading || !canTransfer ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : <ArrowRightLeft size={16} />}
              {loading ? 'Processing...' : 'Transfer Now'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
