import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MetricCard({ label, value, subValue, trend, trendLabel, icon: Icon, gradient, className = '', onClick }) {
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const TrendIcon = trendIcon
  const trendColor = trend > 0 ? 'text-success-400' : trend < 0 ? 'text-danger-400' : 'text-white/40'

  return (
    <div
      className={`glass-card p-4 flex flex-col gap-2 relative overflow-hidden select-none
                  ${onClick ? 'cursor-pointer glass-card-hover active:scale-[0.97]' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Background gradient blob */}
      {gradient && (
        <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${gradient}`} />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          bg-gradient-to-br ${gradient || 'from-brand-600 to-brand-800'} bg-opacity-20`}>
            <Icon size={15} className="text-white/80" />
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="amount-display text-xl font-bold text-white leading-tight">{value}</div>

      {/* Sub-value and trend */}
      <div className="flex items-center justify-between">
        {subValue && <span className="text-xs text-white/40">{subValue}</span>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon size={12} />
            <span className="text-xs font-medium">{trendLabel || `${Math.abs(trend)}%`}</span>
          </div>
        )}
      </div>
    </div>
  )
}
