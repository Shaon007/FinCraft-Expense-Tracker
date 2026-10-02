// TypeScript types matching the Supabase schema
// Used for documentation and optional TS migration

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  currency: string
  monthly_budget: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'expense' | 'income'
  amount: number
  category_id: string | null
  description: string | null
  note: string | null
  date: string
  currency: string
  tags: string[]
  created_at: string
  updated_at: string
  // Joined
  category?: Category
}

export interface Debt {
  id: string
  user_id: string
  label: string
  debtor_name: string
  direction: 'owe' | 'owed'
  principal: number
  remaining: number
  interest_rate: number
  due_date: string | null
  status: 'active' | 'paid' | 'overdue'
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Deposit {
  id: string
  user_id: string
  bank_name: string
  account_type: 'savings' | 'checking' | 'fd' | 'mfs' | 'investment'
  balance: number
  interest_rate: number
  account_number: string | null
  maturity_date: string | null
  currency: string
  notes: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  year: number
  month: number | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> }
      debts: { Row: Debt; Insert: Partial<Debt>; Update: Partial<Debt> }
      deposits: { Row: Deposit; Insert: Partial<Deposit>; Update: Partial<Deposit> }
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> }
    }
  }
}
