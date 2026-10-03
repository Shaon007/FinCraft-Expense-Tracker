import Header from '@/components/common/Header'
import AdvisorSheet from '@/components/ai/AdvisorSheet'
import { useFinance } from '@/context/FinanceContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/currency'
import { BrainCircuit, TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react'
import { getActiveApiKey } from '@/lib/gemini'
import { useNavigate } from 'react-router-dom'

function StatPill({ label, value, color = 'text-white' }) {
  return (
    <div className="glass-card p-3.5">
      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-bold amount-display ${color}`}>{value}</p>
    </div>
  )
}

export default function AdvisorPage() {
  const { metrics, currency } = useFinance()
  const { user } = useAuth()
  const navigate = useNavigate()
  const hasApiKey = !!getActiveApiKey(user?.id)

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* ─── Desktop left panel: context stats ─── */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 lg:border-r lg:border-white/5 lg:shrink-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-base leading-tight">AI Advisor</h2>
              <p className="text-[10px] text-white/40">Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            hasApiKey ? 'bg-success-500/10 text-success-400' : 'bg-warning-500/10 text-warning-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-success-400 animate-pulse' : 'bg-warning-400'}`} />
            {hasApiKey ? 'AI Connected & Ready' : 'API Key Not Configured'}
            {!hasApiKey && (
              <button onClick={() => navigate('/settings')} className="ml-auto underline text-[10px]">
                Add Key →
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-white/5">
          <p className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Your Financial Snapshot</p>
          <div className="space-y-2">
            <StatPill label="Net Worth"     value={formatCurrency(metrics.netWorth, currency, true)}     color="text-brand-300" />
            <StatPill label="Monthly Income"  value={formatCurrency(metrics.totalIncome, currency, true)}  color="text-success-400" />
            <StatPill label="Monthly Expense" value={formatCurrency(metrics.totalExpense, currency, true)} color="text-danger-400" />
            <StatPill label="Total Savings"   value={formatCurrency(metrics.totalSavings, currency, true)} color="text-white" />
            <StatPill label="Active Debt"     value={formatCurrency(metrics.totalOwed, currency, true)}    color="text-warning-400" />
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Savings Rate</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-black text-white amount-display">{metrics.savingsRate.toFixed(1)}%</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              metrics.savingsRate >= 20 ? 'text-success-400 bg-success-500/10' :
              metrics.savingsRate >= 10 ? 'text-warning-400 bg-warning-500/10' : 'text-danger-400 bg-danger-500/10'
            }`}>
              {metrics.savingsRate >= 20 ? 'Excellent' : metrics.savingsRate >= 10 ? 'Good' : 'Needs work'}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-brand-gradient"
              style={{ width: `${Math.min(metrics.savingsRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Chat area ─── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <Header
          title="AI Financial Advisor"
          subtitle="Powered by Gemini 2.5 Flash"
          showActions={false}
        />
        <div className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
          <AdvisorSheet />
        </div>
      </div>
    </div>
  )
}
