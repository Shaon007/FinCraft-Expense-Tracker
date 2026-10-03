/**
 * Currency formatting and conversion utilities
 */

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
]

/**
 * Format a number as currency
 */
export function formatCurrency(amount, currencyCode = 'BDT', compact = false) {
  if (amount === null || amount === undefined) return '—'
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]
  const num = Number(amount)

  if (compact && Math.abs(num) >= 1_000_000) {
    return `${currency.symbol}${(num / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(num) >= 1_000) {
    return `${currency.symbol}${(num / 1_000).toFixed(1)}K`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Format number without currency symbol
 */
export function formatNumber(amount, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount) || 0)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(str) {
  return parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0
}

/**
 * Get currency symbol for a code
 */
export function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol || code
}

/**
 * Calculate percentage
 */
export function calcPercentage(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

/**
 * Determine if an amount change is positive or negative for display
 */
export function getChangeColor(change) {
  if (change > 0) return 'text-success-400'
  if (change < 0) return 'text-danger-400'
  return 'text-white/50'
}

export function getChangePrefix(change) {
  if (change > 0) return '+'
  return ''
}
