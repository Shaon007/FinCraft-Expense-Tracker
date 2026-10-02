import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import CategoryBreakdown from '@/components/expenses/CategoryBreakdown'
import TransactionList from '@/components/expenses/TransactionList'
import AddExpenseSheet from '@/components/expenses/AddExpenseSheet'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function ExpensesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('add') === 'true') setShowAdd(true)
  }, [searchParams])

  const handleClose = () => { setShowAdd(false); setSearchParams({}) }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Expenses" subtitle="Track & manage your spending" />

      {/* Desktop two-column */}
      <div className="hidden lg:grid lg:grid-cols-[340px_1fr] gap-6 px-6 py-5 flex-1">
        <div className="space-y-5">
          <CategoryBreakdown />
          <button
            id="btn-add-expense-desktop"
            onClick={() => setShowAdd(true)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>
        <div>
          <TransactionList />
        </div>
      </div>

      {/* Mobile single-column */}
      <div className="page-container flex-1 pt-4 lg:hidden space-y-4">
        <CategoryBreakdown />
        <TransactionList />
      </div>

      {/* FAB (mobile) */}
      <button
        id="btn-add-expense"
        onClick={() => setShowAdd(true)}
        className="fixed lg:hidden right-4 w-14 h-14 rounded-2xl bg-danger-gradient shadow-card
                   flex items-center justify-center z-20 active:scale-95 transition-all"
        style={{ bottom: 'calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom)))' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showAdd && <AddExpenseSheet onClose={handleClose} />}
    </div>
  )
}
