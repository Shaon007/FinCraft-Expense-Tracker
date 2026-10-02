import { useEffect, useRef, useState } from 'react'

// Simulated live exchange rates (relative to USD)
const TICKERS = [
  { pair: 'EUR/USD', rate: 1.0892, change: +0.12 },
  { pair: 'GBP/USD', rate: 1.2634, change: -0.08 },
  { pair: 'USD/BDT', rate: 109.75, change: +0.23 },
  { pair: 'USD/INR', rate: 83.92,  change: +0.05 },
  { pair: 'USD/JPY', rate: 149.32, change: -0.31 },
  { pair: 'BTC/USD', rate: 67840,  change: +1.82 },
  { pair: 'ETH/USD', rate: 3521,   change: +0.94 },
  { pair: 'XAU/USD', rate: 2612,   change: +0.44 },
]

function TickerItem({ pair, rate, change }) {
  const isPos = change >= 0
  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="text-xs font-semibold text-white/70">{pair}</span>
      <span className="text-xs font-bold text-white tabular-nums">
        {rate >= 1000 ? rate.toLocaleString() : rate.toFixed(4)}
      </span>
      <span className={`text-[10px] font-bold ${isPos ? 'text-success-400' : 'text-danger-400'}`}>
        {isPos ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </span>
    </span>
  )
}

export default function CurrencyTicker() {
  const [rates, setRates] = useState(TICKERS)

  // Simulate minor live rate fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => prev.map(r => ({
        ...r,
        rate: +(r.rate * (1 + (Math.random() - 0.5) * 0.001)).toFixed(r.rate >= 100 ? 2 : 4),
        change: +(r.change + (Math.random() - 0.5) * 0.1).toFixed(2),
      })))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const doubled = [...rates, ...rates]

  return (
    <div className="glass-card overflow-hidden mb-4">
      <div className="flex items-center">
        <div className="bg-brand-gradient px-3 py-2 shrink-0">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-ticker" style={{ width: 'max-content' }}>
            {doubled.map((item, i) => (
              <TickerItem key={i} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
