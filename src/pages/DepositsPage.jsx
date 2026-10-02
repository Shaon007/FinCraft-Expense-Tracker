import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import BankDepositList from '@/components/deposits/BankDepositList'
import AddDepositModal from '@/components/deposits/AddDepositModal'
import TransferModal from '@/components/deposits/TransferModal'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { useSearchParams } from 'react-router-dom'
import { Plus, TrendingUp, ArrowRightLeft } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

function generateGrowthData(totalSavings, avgRate) {
  const rate = avgRate / 100
  return Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    value: Math.round(totalSavings * Math.pow(1 + rate / 12, i)),
  }))
}

export default function DepositsPage() {
  const { deposits, metrics, currency } = useFinance()
  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const avgRate = deposits.length
    ? deposits.reduce((s, d) => s + Number(d.interest_rate), 0) / deposits.length
    : 4.5
  const growthData = generateGrowthData(metrics.totalSavings || 10000, avgRate)

  useEffect(() => {
    if (searchParams.get('add') === 'true') setShowAdd(true)
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Savings & Deposits" subtitle="Your wealth building accounts" />

      {/* Desktop two-column */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_360px] gap-6 px-6 py-5 flex-1">
        {/* Left: Account list */}
        <div className="space-y-4">
          <BankDepositList />
        </div>

        {/* Right: Stats panel */}
        <div className="space-y-5">
          {/* Growth chart */}
          {metrics.totalSavings > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-white/50">12-Month Projection</p>
                  <p className="amount-display text-2xl font-bold text-success-400">
                    {formatCurrency(growthData[11]?.value || 0, currency, true)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-success-500/15 px-3 py-1.5 rounded-xl">
                  <TrendingUp size={12} className="text-success-400" />
                  <span className="text-xs font-semibold text-success-400">{avgRate.toFixed(1)}% avg</span>
                </div>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1E1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v) => [formatCurrency(v, currency, true), 'Projected']}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#growthGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Total savings card */}
          <div className="glass-card p-5 bg-gradient-to-br from-brand-600/15 to-indigo-600/10 border border-brand-500/20">
            <p className="text-xs text-white/50 mb-1">Total Savings</p>
            <div className="amount-display text-3xl font-black text-white mb-3">
              {formatCurrency(metrics.totalSavings, currency, true)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(true)} className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5">
                <Plus size={14} /> Add Account
              </button>
              <button onClick={() => setShowTransfer(true)} className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
                <ArrowRightLeft size={14} /> Transfer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="page-container flex-1 pt-4 lg:hidden space-y-4">
        {metrics.totalSavings > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-white/50">12-Month Projection</p>
                <p className="amount-display text-xl font-bold text-success-400">
                  {formatCurrency(growthData[11]?.value || 0, currency, true)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-success-500/15 px-3 py-1.5 rounded-xl">
                <TrendingUp size={12} className="text-success-400" />
                <span className="text-xs font-semibold text-success-400">{avgRate.toFixed(1)}% avg</span>
              </div>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthGradM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1E1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} formatter={(v) => [formatCurrency(v, currency, true)]} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#growthGradM)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <BankDepositList />
      </div>

      {/* FABs (mobile) */}
      <div className="fixed lg:hidden flex gap-3 z-20"
           style={{ bottom: 'calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom)))', right: '1rem' }}>
        <button
          id="btn-transfer-mobile"
          onClick={() => setShowTransfer(true)}
          className="w-12 h-12 rounded-xl bg-surface-700 border border-white/10 shadow-card
                     flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowRightLeft size={18} className="text-brand-400" />
        </button>
        <button
          id="btn-add-deposit"
          onClick={() => setShowAdd(true)}
          className="w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>

      {showAdd && <AddDepositModal onClose={() => { setShowAdd(false); setSearchParams({}) }} />}
      {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} />}
    </div>
  )
}
