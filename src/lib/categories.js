/**
 * Category utilities and icon sanitization
 * Ensures emojis never render as double-encoded mojibake (e.g. 'ðŸ ”')
 */

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat_food',          name: 'Food & Dining',    icon: '🍔', color: '#F59E0B', type: 'expense' },
  { id: 'cat_transport',     name: 'Transportation',   icon: '🚗', color: '#3B82F6', type: 'expense' },
  { id: 'cat_shopping',      name: 'Shopping',         icon: '🛍️', color: '#EC4899', type: 'expense' },
  { id: 'cat_housing',       name: 'Housing & Rent',   icon: '🏠', color: '#8B5CF6', type: 'expense' },
  { id: 'cat_bills',         name: 'Bills & Utilities',icon: '⚡', color: '#EF4444', type: 'expense' },
  { id: 'cat_entertainment', name: 'Entertainment',    icon: '🎬', color: '#06B6D4', type: 'expense' },
  { id: 'cat_health',        name: 'Health & Medical', icon: '💊', color: '#10B981', type: 'expense' },
  { id: 'cat_education',     name: 'Education',        icon: '📚', color: '#F97316', type: 'expense' },
  { id: 'cat_travel',        name: 'Travel & Trips',   icon: '✈️', color: '#6366F1', type: 'expense' },
  { id: 'cat_subscriptions', name: 'Subscriptions',    icon: '📱', color: '#84CC16', type: 'expense' },
  { id: 'cat_personal',      name: 'Personal Care',    icon: '💆', color: '#A78BFA', type: 'expense' },
  { id: 'cat_other_exp',     name: 'Other Expense',    icon: '📦', color: '#6B7280', type: 'expense' },
]

export const DEFAULT_INCOME_CATEGORIES = [
  { id: 'cat_salary',        name: 'Monthly Salary',   icon: '💼', color: '#10B981', type: 'income' },
  { id: 'cat_freelance',     name: 'Freelance / Side', icon: '💻', color: '#06B6D4', type: 'income' },
  { id: 'cat_business',      name: 'Business Profit',  icon: '🏢', color: '#3B82F6', type: 'income' },
  { id: 'cat_investment',    name: 'Investments / ROI',icon: '📈', color: '#8B5CF6', type: 'income' },
  { id: 'cat_bonus',         name: 'Bonus / Gift',     icon: '🎁', color: '#EC4899', type: 'income' },
  { id: 'cat_other_inc',     name: 'Other Income',     icon: '💵', color: '#84CC16', type: 'income' },
]

/**
 * Returns a clean, valid emoji for any category name/icon
 * Prevents corrupted UTF-8 mojibake (like 'ðŸ ”' or 'âœˆï¸ ') from ever displaying
 */
export function sanitizeCategoryIcon(name = '', currentIcon = '') {
  // If icon is corrupted mojibake (contains non-standard byte sequences)
  const isCorrupted = !currentIcon ||
    typeof currentIcon !== 'string' ||
    currentIcon.includes('ð') ||
    currentIcon.includes('â') ||
    currentIcon.includes('ï') ||
    currentIcon.includes('?') ||
    currentIcon.trim() === ''

  if (!isCorrupted && /\p{Extended_Pictographic}/u.test(currentIcon)) {
    return currentIcon
  }

  const n = (name || '').toLowerCase()

  if (n.includes('food') || n.includes('dining') || n.includes('grocer') || n.includes('eat')) return '🍔'
  if (n.includes('transport') || n.includes('car') || n.includes('fuel') || n.includes('bus') || n.includes('ride')) return '🚗'
  if (n.includes('shop') || n.includes('cloth') || n.includes('market')) return '🛍️'
  if (n.includes('hous') || n.includes('rent') || n.includes('home')) return '🏠'
  if (n.includes('util') || n.includes('bill') || n.includes('electr') || n.includes('gas') || n.includes('water')) return '⚡'
  if (n.includes('entertain') || n.includes('movie') || n.includes('game')) return '🎬'
  if (n.includes('health') || n.includes('medic') || n.includes('fit') || n.includes('doctor')) return '💊'
  if (n.includes('educat') || n.includes('school') || n.includes('book') || n.includes('course')) return '📚'
  if (n.includes('travel') || n.includes('trip') || n.includes('flight') || n.includes('hotel')) return '✈️'
  if (n.includes('subscript') || n.includes('recharge') || n.includes('mobile') || n.includes('phone') || n.includes('wifi')) return '📱'
  if (n.includes('personal') || n.includes('salon') || n.includes('care')) return '💆'
  if (n.includes('salary') || n.includes('paycheck') || n.includes('wage')) return '💼'
  if (n.includes('freelance') || n.includes('project') || n.includes('remote')) return '💻'
  if (n.includes('business') || n.includes('profit')) return '🏢'
  if (n.includes('invest') || n.includes('dividend') || n.includes('dps') || n.includes('stock')) return '📈'
  if (n.includes('gift') || n.includes('bonus') || n.includes('reward')) return '🎁'
  if (n.includes('income')) return '💵'

  return '📦'
}
