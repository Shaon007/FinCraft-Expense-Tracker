import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const FinanceContext = createContext(null)

// Demo data for unauthenticated / env-missing users
const DEMO_TRANSACTIONS = [
  { id: '1', type: 'income',  amount: 4500, description: 'Monthly Salary',    category: { name: 'Income',         icon: '💼', color: '#10B981' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
  { id: '2', type: 'expense', amount: 850,  description: 'Rent Payment',       category: { name: 'Housing',        icon: '🏠', color: '#8B5CF6' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
  { id: '3', type: 'expense', amount: 120,  description: 'Grocery Shopping',   category: { name: 'Food & Dining',  icon: '🍔', color: '#F59E0B' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
  { id: '4', type: 'expense', amount: 45,   description: 'Netflix + Spotify',  category: { name: 'Subscriptions', icon: '📱', color: '#84CC16' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
  { id: '5', type: 'expense', amount: 200,  description: 'Flight Tickets',     category: { name: 'Travel',        icon: '✈️', color: '#6366F1' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
  { id: '6', type: 'income',  amount: 750,  description: 'Freelance Project',  category: { name: 'Income',        icon: '💼', color: '#10B981' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD' },
]

const DEMO_DEBTS = [
  { id: '1', label: 'Car Loan',   debtor_name: 'City Bank',   direction: 'owe',  principal: 12000, remaining: 8400,  interest_rate: 5.5, due_date: '2027-06-01', status: 'active',  currency: 'USD' },
  { id: '2', label: 'John owes',  debtor_name: 'John Doe',    direction: 'owed', principal: 500,   remaining: 500,   interest_rate: 0,   due_date: '2026-11-01', status: 'active',  currency: 'USD' },
  { id: '3', label: 'Study Loan', debtor_name: 'Edu Finance', direction: 'owe',  principal: 5000,  remaining: 3200,  interest_rate: 8.0, due_date: '2026-12-31', status: 'active',  currency: 'USD' },
]

const DEMO_DEPOSITS = [
  { id: 'dep1', bank_name: 'Chase Bank',     account_type: 'savings',    balance: 12500, interest_rate: 4.5, is_primary: true,  currency: 'USD' },
  { id: 'dep2', bank_name: 'Vanguard',       account_type: 'investment', balance: 34200, interest_rate: 7.2, is_primary: false, currency: 'USD' },
  { id: 'dep3', bank_name: 'Marcus Goldman', account_type: 'fd',         balance: 5000,  interest_rate: 5.1, is_primary: false, currency: 'USD', maturity_date: '2027-03-15' },
]

const DEMO_TRANSFERS = [
  { id: 'tr1', from_account_id: 'dep1', to_account_id: 'dep2', amount: 1000, note: 'Monthly investment', date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD', from_account: { bank_name: 'Chase Bank', account_type: 'savings' }, to_account: { bank_name: 'Vanguard', account_type: 'investment' } },
]

const DEMO_CATEGORIES = [
  { id: '1', name: 'Food & Dining',   icon: '🍔', color: '#F59E0B' },
  { id: '2', name: 'Transportation',  icon: '🚗', color: '#3B82F6' },
  { id: '3', name: 'Shopping',        icon: '🛍️', color: '#EC4899' },
  { id: '4', name: 'Housing',         icon: '🏠', color: '#8B5CF6' },
  { id: '5', name: 'Entertainment',   icon: '🎬', color: '#06B6D4' },
  { id: '6', name: 'Health & Fitness',icon: '💊', color: '#10B981' },
  { id: '7', name: 'Education',       icon: '📚', color: '#F97316' },
  { id: '8', name: 'Travel',          icon: '✈️', color: '#6366F1' },
  { id: '9', name: 'Subscriptions',   icon: '📱', color: '#84CC16' },
  { id: '10',name: 'Utilities',       icon: '⚡', color: '#EF4444' },
  { id: '11',name: 'Personal Care',   icon: '💆', color: '#A78BFA' },
  { id: '12',name: 'Other',           icon: '📦', color: '#6B7280' },
]

export function FinanceProvider({ children }) {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [debts, setDebts] = useState([])
  const [deposits, setDeposits] = useState([])
  const [transfers, setTransfers] = useState([])
  const [categories, setCategories] = useState(DEMO_CATEGORIES)
  const [loading, setLoading] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const currency = profile?.currency || 'USD'

  const loadAll = useCallback(async () => {
    if (!user) {
      setTransactions(DEMO_TRANSACTIONS)
      setDebts(DEMO_DEBTS)
      setDeposits(DEMO_DEPOSITS)
      setTransfers(DEMO_TRANSFERS)
      setIsDemoMode(true)
      return
    }
    setIsDemoMode(false)
    setLoading(true)
    try {
      const [txRes, debtRes, depRes, catRes, trRes] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('deposits').select('*').eq('user_id', user.id).order('balance', { ascending: false }),
        supabase.from('categories').select('*').or(`user_id.eq.${user.id},is_default.eq.true`),
        supabase.from('account_transfers').select('*, from_account:deposits!from_account_id(*), to_account:deposits!to_account_id(*)').eq('user_id', user.id).order('date', { ascending: false }).limit(50),
      ])
      if (txRes.data)   setTransactions(txRes.data)
      if (debtRes.data) setDebts(debtRes.data)
      if (depRes.data)  setDeposits(depRes.data)
      if (catRes.data)  setCategories(catRes.data)
      if (trRes.data)   setTransfers(trRes.data)
    } catch (e) {
      console.error('Load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  // ── TRANSACTIONS ──────────────────────────────────────────────
  const addTransaction = async (data) => {
    if (isDemoMode) {
      const cat = categories.find(c => c.id === data.category_id) || categories[11]
      const newTx = { ...data, id: Date.now().toString(), category: cat, date: data.date || format(new Date(), 'yyyy-MM-dd'), currency }
      setTransactions(prev => [newTx, ...prev])
      return newTx
    }
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user.id, currency })
      .select('*, category:categories(*)')
      .single()
    if (error) throw error
    setTransactions(prev => [tx, ...prev])
    return tx
  }

  const deleteTransaction = async (id) => {
    if (isDemoMode) { setTransactions(prev => prev.filter(t => t.id !== id)); return }
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // ── DEBTS ─────────────────────────────────────────────────────
  const addDebt = async (data) => {
    if (isDemoMode) {
      const newDebt = { ...data, id: Date.now().toString(), currency, status: 'active', created_at: new Date().toISOString() }
      setDebts(prev => [newDebt, ...prev])
      return newDebt
    }
    const { data: debt, error } = await supabase.from('debts').insert({ ...data, user_id: user.id, currency }).select().single()
    if (error) throw error
    setDebts(prev => [debt, ...prev])
    return debt
  }

  const updateDebt = async (id, updates) => {
    if (isDemoMode) { setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d)); return }
    const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select().single()
    if (error) throw error
    setDebts(prev => prev.map(d => d.id === id ? data : d))
  }

  const deleteDebt = async (id) => {
    if (isDemoMode) { setDebts(prev => prev.filter(d => d.id !== id)); return }
    await supabase.from('debts').delete().eq('id', id)
    setDebts(prev => prev.filter(d => d.id !== id))
  }

  // ── DEPOSITS ──────────────────────────────────────────────────
  const addDeposit = async (data) => {
    if (isDemoMode) {
      const newDep = { ...data, id: Date.now().toString(), currency }
      setDeposits(prev => [newDep, ...prev])
      return newDep
    }
    const { data: dep, error } = await supabase.from('deposits').insert({ ...data, user_id: user.id, currency }).select().single()
    if (error) throw error
    setDeposits(prev => [dep, ...prev])
    return dep
  }

  const updateDeposit = async (id, updates) => {
    if (isDemoMode) { setDeposits(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d)); return }
    const { data, error } = await supabase.from('deposits').update(updates).eq('id', id).select().single()
    if (error) throw error
    setDeposits(prev => prev.map(d => d.id === id ? data : d))
  }

  const deleteDeposit = async (id) => {
    if (isDemoMode) { setDeposits(prev => prev.filter(d => d.id !== id)); return }
    await supabase.from('deposits').delete().eq('id', id)
    setDeposits(prev => prev.filter(d => d.id !== id))
  }

  // ── TRANSFERS ─────────────────────────────────────────────────
  const addTransfer = async (data) => {
    const { from_account_id, to_account_id, amount } = data

    if (isDemoMode) {
      const fromAcc = deposits.find(d => d.id === from_account_id)
      const toAcc   = deposits.find(d => d.id === to_account_id)
      // Update balances in demo state
      setDeposits(prev => prev.map(d => {
        if (d.id === from_account_id) return { ...d, balance: Number(d.balance) - Number(amount) }
        if (d.id === to_account_id)   return { ...d, balance: Number(d.balance) + Number(amount) }
        return d
      }))
      const newTransfer = {
        ...data,
        id: Date.now().toString(),
        currency,
        created_at: new Date().toISOString(),
        from_account: fromAcc,
        to_account: toAcc,
      }
      setTransfers(prev => [newTransfer, ...prev])
      return newTransfer
    }

    // Production: use atomic stored procedure
    const { data: result, error } = await supabase.rpc('perform_transfer', {
      p_user_id:  user.id,
      p_from_id:  from_account_id,
      p_to_id:    to_account_id,
      p_amount:   amount,
      p_note:     data.note || null,
      p_date:     data.date,
      p_currency: currency,
    })
    if (error) throw error
    // Reload deposits to get fresh balances
    await loadAll()
    return result
  }

  const deleteTransfer = async (id) => {
    if (isDemoMode) { setTransfers(prev => prev.filter(t => t.id !== id)); return }
    await supabase.from('account_transfers').delete().eq('id', id)
    setTransfers(prev => prev.filter(t => t.id !== id))
  }

  // ── COMPUTED METRICS ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
    const monthly = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd)

    const totalIncome  = monthly.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const netCash      = totalIncome - totalExpense
    const totalSavings = deposits.reduce((s, d) => s + Number(d.balance), 0)
    const totalOwed    = debts.filter(d => d.direction === 'owe'  && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)
    const totalOwedToMe= debts.filter(d => d.direction === 'owed' && d.status === 'active').reduce((s, d) => s + Number(d.remaining), 0)
    const netWorth     = totalSavings + totalOwedToMe - totalOwed
    const categoryBreakdown = categories.map(cat => {
      const catExpenses = monthly.filter(t => t.type === 'expense' && t.category?.name === cat.name)
      return { ...cat, spent: catExpenses.reduce((s, t) => s + Number(t.amount), 0) }
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0

    return { totalIncome, totalExpense, netCash, totalSavings, totalOwed, totalOwedToMe, netWorth, categoryBreakdown, savingsRate }
  }, [transactions, deposits, debts, categories])

  return (
    <FinanceContext.Provider value={{
      transactions, debts, deposits, transfers, categories, loading, isDemoMode, currency, metrics,
      addTransaction, deleteTransaction,
      addDebt, updateDebt, deleteDebt,
      addDeposit, updateDeposit, deleteDeposit,
      addTransfer, deleteTransfer,
      refresh: loadAll,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
