import { useState, useEffect } from 'react'
import { analyzeSpendingRisks } from '@/lib/gemini'
import { useFinance } from '@/context/FinanceContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/currency'
import { AlertTriangle, Info, XCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

const SEVERITY_CONFIG = {
  info:    { icon: Info,          className: 'border-info-500/20 bg-info-500/5 text-info-400',    iconClass: 'text-info-400'    },
  warning: { icon: AlertTriangle, className: 'border-warning-500/20 bg-warning-500/5 text-warning-400', iconClass: 'text-warning-400' },
  danger:  { icon: XCircle,       className: 'border-danger-500/20 bg-danger-500/5 text-danger-400', iconClass: 'text-danger-400'  },
}

const RISK_LABEL = {
  low:    { label: 'Low Risk',    className: 'badge-success' },
  medium: { label: 'Medium Risk', className: 'badge-warning' },
  high:   { label: 'High Risk',   className: 'badge-danger'  },
}

export default function SpendingRiskAlert() {
  const { metrics, currency } = useFinance()
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [ran, setRan] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const data = {
        monthlyIncome: metrics.totalIncome,
        monthlyExpense: metrics.totalExpense,
        totalDebt: metrics.totalOwed,
        savingsRate: metrics.savingsRate,
        topCategories: metrics.categoryBreakdown.slice(0, 5).map(c => ({ name: c.name, amount: c.spent })),
      }
      const result = await analyzeSpendingRisks(data, user?.id)
      setAnalysis(result)
      setRan(true)
    } catch (err) {
      console.error('Risk analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-run on first mount if data exists
  useEffect(() => {
    if (!ran && metrics.totalExpense > 0) {
      runAnalysis()
    }
  }, [metrics.totalExpense])

  if (!ran && !loading) {
    return (
      <button
        onClick={runAnalysis}
        className="w-full glass-card p-4 flex items-center gap-3 border border-brand-500/20 hover:border-brand-500/40 transition-all active:scale-[0.98]"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white">Analyze Spending Risks</p>
          <p className="text-xs text-white/40">AI-powered insights based on your data</p>
        </div>
        <div className="text-brand-400 text-xs font-medium">Analyze →</div>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center animate-pulse-glow">
          <Sparkles size={16} className="text-white animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Analyzing your finances...</p>
          <p className="text-xs text-white/40">This takes a moment</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const risk = RISK_LABEL[analysis.riskLevel] || RISK_LABEL.medium
  const visibleAlerts = expanded ? analysis.alerts : analysis.alerts?.slice(0, 2)

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold-400" />
          <span className="text-sm font-semibold text-white">AI Risk Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={risk.className}>{risk.label}</span>
          <button onClick={runAnalysis} className="text-xs text-white/30 hover:text-white/60 transition-colors">↻</button>
        </div>
      </div>

      {/* Top Insight */}
      {analysis.topInsight && (
        <div className="px-4 pb-3">
          <p className="text-xs text-white/60 leading-relaxed">{analysis.topInsight}</p>
        </div>
      )}

      {/* Alerts */}
      {analysis.alerts?.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {visibleAlerts.map((alert, i) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
            const Icon = cfg.icon
            return (
              <div key={i} className={`flex gap-2.5 p-3 rounded-xl border ${cfg.className}`}>
                <Icon size={14} className={`${cfg.iconClass} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-semibold">{alert.category}</p>
                  <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
                </div>
              </div>
            )
          })}

          {analysis.alerts.length > 2 && (
            <button onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs text-white/40 hover:text-white/70 py-1 transition-colors">
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> {analysis.alerts.length - 2} more alerts</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
