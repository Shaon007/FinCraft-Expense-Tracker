import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { sanitizeCategoryIcon, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/categories'

const FinanceContext = createContext(null)

// Demo / starter data matching user's structure: 3 Mobile Banking, 2 Bank accounts, 2 Monthly DPS schemes
const DEMO_TRANSACTIONS = [
  { id: '1', type: 'expense', amount: 3200,  description: 'Grocery Shopping',   category: { name: 'Food & Dining',  icon: '🍔', color: '#F59E0B' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'BDT' },
  { id: '2', type: 'expense', amount: 1200,  description: 'Electricity Bill',   category: { name: 'Utilities',      icon: '⚡', color: '#EF4444' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'BDT' },
  { id: '3', type: 'expense', amount: 800,   description: 'Mobile Recharge',    category: { name: 'Subscriptions',  icon: '📱', color: '#84CC16' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'BDT' },
  { id: '4', type: 'income',  amount: 15000, description: 'Freelance Design',  category: { name: 'Income',         icon: '💼', color: '#10B981' }, date: format(new Date(), 'yyyy-MM-dd'), currency: 'BDT' },
]

const DEMO_DEBTS = [
  { id: 'loan_taken_1', label: 'Car Loan EMI',      debtor_name: 'BRAC Bank',     direction: 'owe',  principal: 250000, remaining: 180000, interest_rate: 9.0, due_date: '2027-06-01', status: 'active',  currency: 'BDT', notes: 'Loan taken' },
  { id: 'loan_given_1', label: 'Loan to Rahim',     debtor_name: 'Rahim Uddin',   direction: 'owed', principal: 15000,  remaining: 15000,  interest_rate: 0,   due_date: '2026-12-01', status: 'active',  currency: 'BDT', notes: 'Loan given' },
]

const DEMO_DEPOSITS = [
  // 3 Mobile Banking Accounts
  { id: 'mfs_bkash',  bank_name: 'bKash',             account_type: 'mfs',     balance: 35000,  interest_rate: 0,   is_primary: true,  currency: 'BDT', account_number: '01700' },
  { id: 'mfs_nagad',  bank_name: 'Nagad',             account_type: 'mfs',     balance: 18500,  interest_rate: 0,   is_primary: false, currency: 'BDT', account_number: '01800' },
  { id: 'mfs_rocket', bank_name: 'Rocket',            account_type: 'mfs',     balance: 9200,   interest_rate: 0,   is_primary: false, currency: 'BDT', account_number: '01900' },
  // 2 Bank Accounts
  { id: 'bank_city',  bank_name: 'City Bank',         account_type: 'savings', balance: 145000, interest_rate: 4.5, is_primary: false, currency: 'BDT', account_number: '1001' },
  { id: 'bank_ebl',   bank_name: 'Eastern Bank (EBL)',account_type: 'savings', balance: 95000,  interest_rate: 5.0, is_primary: false, currency: 'BDT', account_number: '2002' },
  // 2 Ongoing Monthly DPS Accounts (credited from bKash)
  {
    id: 'dps_city',
    bank_name: 'City Bank Monthly DPS',
    account_type: 'dps',
    balance: 65000,
    monthly_deposit: 5000,
    deposit_day: 5,
    source_account_id: 'mfs_bkash',
    source_account_name: 'bKash',
    interest_rate: 8.5,
    is_primary: false,
    currency: 'BDT',
    last_auto_debit_month: '',
    tenure_years: 5,
  },
  {
    id: 'dps_brac',
    bank_name: 'BRAC Sanchay DPS',
    account_type: 'dps',
    balance: 32000,
    monthly_deposit: 2000,
    deposit_day: 10,
    source_account_id: 'mfs_bkash',
    source_account_name: 'bKash',
    interest_rate: 8.0,
    is_primary: false,
    currency: 'BDT',
    last_auto_debit_month: '',
    tenure_years: 3,
  },
]

const DEMO_TRANSFERS = [
  { id: 'tr1', from_account_id: 'mfs_bkash', to_account_id: 'dps_city', amount: 5000, note: 'Monthly DPS Installment', date: format(new Date(), 'yyyy-MM-dd'), currency: 'BDT', from_account: { bank_name: 'bKash', account_type: 'mfs' }, to_account: { bank_name: 'City Bank Monthly DPS', account_type: 'dps' } },
]

const DEMO_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
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

  const currency = profile?.currency || 'BDT'

  const loadAll = useCallback(async () => {
    if (!user) {
      setTransactions(DEMO_TRANSACTIONS)
      setDebts(DEMO_DEBTS)
      setDeposits(DEMO_DEPOSITS)
      setTransfers(DEMO_TRANSFERS)
      setCategories(DEMO_CATEGORIES)
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
      if (txRes.data) {
        const sanitizedTx = txRes.data.map(tx => ({
          ...tx,
          category: tx.category ? {
            ...tx.category,
            icon: sanitizeCategoryIcon(tx.category.name, tx.category.icon)
          } : null
        }))
        setTransactions(sanitizedTx)
      }
      if (debtRes.data) setDebts(debtRes.data)
      if (depRes.data) {
        const mapped = depRes.data.map(d => {
          if (d.notes && typeof d.notes === 'string' && d.notes.startsWith('DPS_META:')) {
            try {
              const meta = JSON.parse(d.notes.replace('DPS_META:', ''))
              return { ...d, ...meta }
            } catch {
              return d
            }
          }
          return d
        })
        setDeposits(mapped)
      }
      if (catRes.data && catRes.data.length > 0) {
        const sanitized = catRes.data.map(c => ({
          ...c,
          icon: sanitizeCategoryIcon(c.name, c.icon)
        }))
        setCategories(sanitized)
      } else {
        setCategories(DEMO_CATEGORIES)
      }
      if (trRes.data) setTransfers(trRes.data)
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
      const cat = categories.find(c => c.id === data.category_id) || categories[0]
      const newTx = {
        ...data,
        id: Date.now().toString(),
        category: cat ? { ...cat, icon: sanitizeCategoryIcon(cat.name, cat.icon) } : null,
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        currency
      }
      setTransactions(prev => [newTx, ...prev])
      return newTx
    }
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user.id, currency })
      .select('*, category:categories(*)')
      .single()
    if (error) throw error
    const sanitizedTx = {
      ...tx,
      category: tx.category ? {
        ...tx.category,
        icon: sanitizeCategoryIcon(tx.category.name, tx.category.icon)
      } : null
    }
    setTransactions(prev => [sanitizedTx, ...prev])
    return sanitizedTx
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

    try {
      // 1. Try full insert (works when migration with deposit_day exists)
      const { data: dep, error } = await supabase
        .from('deposits')
        .insert({ ...data, user_id: user.id, currency })
        .select()
        .single()
      if (!error && dep) {
        setDeposits(prev => [dep, ...prev])
        return dep
      }
      if (error) throw error
    } catch (err) {
      // 2. Resilient fallback if Supabase table hasn't added the new columns yet
      console.warn('Direct deposit insert failed, using schema compatibility fallback:', err.message)
      const standardPayload = {
        user_id: user.id,
        currency,
        bank_name: data.bank_name,
        account_type: ['savings', 'checking', 'fd', 'mfs', 'investment'].includes(data.account_type) ? data.account_type : 'savings',
        balance: data.balance,
        interest_rate: data.interest_rate || 0,
        account_number: data.account_number || null,
        maturity_date: data.maturity_date || null,
        is_primary: !!data.is_primary,
      }

      if (data.account_type === 'dps' || data.monthly_deposit || data.deposit_day) {
        const dpsMeta = {
          account_type: 'dps',
          monthly_deposit: data.monthly_deposit,
          deposit_day: data.deposit_day,
          source_account_id: data.source_account_id,
          source_account_name: data.source_account_name,
        }
        standardPayload.notes = `DPS_META:${JSON.stringify(dpsMeta)}`
      } else {
        standardPayload.notes = data.notes || null
      }

      const { data: fallbackDep, error: fallbackErr } = await supabase
        .from('deposits')
        .insert(standardPayload)
        .select()
        .single()

      if (fallbackErr) throw fallbackErr

      const finalDep = data.account_type === 'dps'
        ? {
            ...fallbackDep,
            account_type: 'dps',
            monthly_deposit: data.monthly_deposit,
            deposit_day: data.deposit_day,
            source_account_id: data.source_account_id,
            source_account_name: data.source_account_name,
          }
        : fallbackDep

      setDeposits(prev => [finalDep, ...prev])
      return finalDep
    }
  }

  const updateDeposit = async (id, updates) => {
    if (isDemoMode) { setDeposits(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d)); return }
    try {
      const { data, error } = await supabase.from('deposits').update(updates).eq('id', id).select().single()
      if (error) throw error
      setDeposits(prev => prev.map(d => d.id === id ? data : d))
      return data
    } catch (err) {
      console.warn('Direct update failed, retrying with standard columns:', err.message)
      const safeUpdates = { ...updates }
      delete safeUpdates.deposit_day
      delete safeUpdates.monthly_deposit
      delete safeUpdates.source_account_id
      delete safeUpdates.source_account_name
      delete safeUpdates.last_auto_debit_month
      if (safeUpdates.account_type === 'dps') safeUpdates.account_type = 'savings'

      const { data, error } = await supabase.from('deposits').update(safeUpdates).eq('id', id).select().single()
      if (error) throw error
      const merged = { ...data, ...updates }
      setDeposits(prev => prev.map(d => d.id === id ? merged : d))
      return merged
    }
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

  const updateDepositBalance = async (id, newBalance) => {
    const balanceNum = parseFloat(newBalance)
    if (isNaN(balanceNum)) return
    return updateDeposit(id, { balance: balanceNum })
  }

  // ── DPS AUTOMATION ENGINE ─────────────────────────────────────
  // Automatically credits fixed-date DPS installments from source (e.g. bKash)
  const runDpsAutomation = useCallback(async (currentDeps = deposits) => {
    if (!currentDeps || currentDeps.length === 0) return
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonthKey = format(now, 'yyyy-MM')

    const dpsList = currentDeps.filter(d =>
      d.account_type === 'dps' &&
      Number(d.monthly_deposit) > 0 &&
      d.source_account_id &&
      d.last_auto_debit_month !== currentMonthKey &&
      currentDay >= (Number(d.deposit_day) || 1)
    )

    if (dpsList.length === 0) return

    for (const dps of dpsList) {
      const source = currentDeps.find(s => s.id === dps.source_account_id)
      if (!source) continue
      const installment = Number(dps.monthly_deposit)

      if (Number(source.balance) < installment) {
        toast.error(`⚠️ Insufficient balance in ${source.bank_name} for DPS: ${dps.bank_name} (Needs ${installment})`, { duration: 6000 })
        continue
      }

      try {
        if (isDemoMode) {
          setDeposits(prev => prev.map(item => {
            if (item.id === source.id) return { ...item, balance: Number(item.balance) - installment }
            if (item.id === dps.id)    return { ...item, balance: Number(item.balance) + installment, last_auto_debit_month: currentMonthKey }
            return item
          }))

          const autoTransfer = {
            id: 'auto_dps_' + Date.now() + '_' + dps.id,
            from_account_id: source.id,
            to_account_id: dps.id,
            amount: installment,
            note: `Monthly DPS Auto-Credit (${format(now, 'MMM yyyy')})`,
            date: format(now, 'yyyy-MM-dd'),
            currency,
            from_account: source,
            to_account: dps,
            is_automated: true,
          }
          setTransfers(prev => [autoTransfer, ...prev])
          toast.success(`🎯 DPS Auto-Credited: ${format(now, 'MMM')} installment of ${installment.toLocaleString()} BDT sent from ${source.bank_name} to ${dps.bank_name}!`, { duration: 6000 })
        } else {
          await supabase.rpc('perform_transfer', {
            p_user_id: user.id,
            p_from_id: source.id,
            p_to_id: dps.id,
            p_amount: installment,
            p_note: `Monthly DPS Auto-Credit (${format(now, 'MMM yyyy')})`,
            p_date: format(now, 'yyyy-MM-dd'),
            p_currency: currency,
          })
          await supabase.from('deposits').update({ last_auto_debit_month: currentMonthKey }).eq('id', dps.id)
          await loadAll()
          toast.success(`🎯 DPS Auto-Credited: ${installment.toLocaleString()} BDT from ${source.bank_name} to ${dps.bank_name}!`)
        }
      } catch (err) {
        console.error('DPS auto-credit failed:', err)
      }
    }
  }, [deposits, isDemoMode, user, currency, loadAll])

  // Run DPS automation check when deposits change
  useEffect(() => {
    if (deposits && deposits.length > 0) {
      runDpsAutomation(deposits)
    }
  }, [deposits.length])

  // ── COMPUTED METRICS ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
    const monthly = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd)

    const totalIncome  = monthly.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const netCash      = totalIncome - totalExpense

    // Categorized accounts
    const liquidAccounts = deposits.filter(d => ['savings', 'checking', 'mfs', 'cash'].includes(d.account_type))
    const mfsAccounts    = deposits.filter(d => d.account_type === 'mfs')
    const bankAccounts   = deposits.filter(d => ['savings', 'checking'].includes(d.account_type))
    const dpsAccounts    = deposits.filter(d => d.account_type === 'dps')
    const fdAccounts     = deposits.filter(d => ['fd', 'investment'].includes(d.account_type))

    // Balances
    const currentBalance = liquidAccounts.reduce((s, d) => s + Number(d.balance), 0)
    const mfsBalance     = mfsAccounts.reduce((s, d) => s + Number(d.balance), 0)
    const bankBalance    = bankAccounts.reduce((s, d) => s + Number(d.balance), 0)
    const dpsBalance     = dpsAccounts.reduce((s, d) => s + Number(d.balance), 0)
    const fdBalance      = fdAccounts.reduce((s, d) => s + Number(d.balance), 0)
    const totalSavings   = deposits.reduce((s, d) => s + Number(d.balance), 0)

    // Debts & Loans
    const loansTaken  = debts.filter(d => d.direction === 'owe'  && d.status === 'active')
    const loansGiven  = debts.filter(d => d.direction === 'owed' && d.status === 'active')
    const totalOwed   = loansTaken.reduce((s, d) => s + Number(d.remaining), 0)
    const totalOwedToMe = loansGiven.reduce((s, d) => s + Number(d.remaining), 0)

    // Net worth = All Liquid + DPS + FD + Loans Given - Loans Taken
    const netWorth    = totalSavings + totalOwedToMe - totalOwed

    const categoryBreakdown = categories.map(cat => {
      const catExpenses = monthly.filter(t => t.type === 'expense' && t.category?.name === cat.name)
      return { ...cat, spent: catExpenses.reduce((s, t) => s + Number(t.amount), 0) }
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent)
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0

    return {
      totalIncome,
      totalExpense,
      netCash,
      currentBalance,
      mfsBalance,
      bankBalance,
      dpsBalance,
      fdBalance,
      totalSavings,
      totalOwed,
      totalOwedToMe,
      netWorth,
      categoryBreakdown,
      savingsRate,
      liquidAccounts,
      mfsAccounts,
      bankAccounts,
      dpsAccounts,
      fdAccounts,
      loansTaken,
      loansGiven,
    }
  }, [transactions, deposits, debts, categories])

  return (
    <FinanceContext.Provider value={{
      transactions, debts, deposits, transfers, categories, loading, isDemoMode, currency, metrics,
      addTransaction, deleteTransaction,
      addDebt, updateDebt, deleteDebt,
      addDeposit, updateDeposit, updateDepositBalance, deleteDeposit,
      addTransfer, deleteTransfer,
      runDpsAutomation,
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
