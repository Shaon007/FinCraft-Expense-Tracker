import { useFinance } from '@/context/FinanceContext'
import { formatCurrency, calcPercentage } from '@/lib/currency'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { sanitizeCategoryIcon } from '@/lib/categories'

export default function CategoryBreakdown() {
  const { metrics, currency } = useFinance()
  const { categoryBreakdown, totalExpense } = metrics

  if (!categoryBreakdown.length) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-white/50 text-sm">No expenses this month</p>
      </div>
    )
  }

  const top5 = categoryBreakdown.slice(0, 5)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const { name, value } = payload[0].payload
      return (
        <div className="glass-card px-3 py-2 border border-white/10">
          <p className="text-xs font-bold text-white">{name}</p>
          <p className="text-xs text-white/60">{formatCurrency(value, currency)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-card p-4">
      <h3 className="section-title mb-4">Spending by Category</h3>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top5}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={52}
                paddingAngle={3}
                dataKey="spent"
                nameKey="name"
              >
                {top5.map((cat, i) => (
                  <Cell key={cat.id} fill={cat.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {top5.map(cat => {
            const pct = calcPercentage(cat.spent, totalExpense)
            const icon = sanitizeCategoryIcon(cat.name, cat.icon)
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="text-xs text-white/80 truncate font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-white/50">{pct}%</span>
                    <span className="text-xs font-bold text-white">{formatCurrency(cat.spent, currency, true)}</span>
                  </div>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
