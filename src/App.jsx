import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { FinanceProvider } from '@/context/FinanceContext'
import BottomNav from '@/components/common/BottomNav'
import Sidebar from '@/components/common/Sidebar'

// Pages
import DashboardPage from '@/pages/DashboardPage'
import ExpensesPage from '@/pages/ExpensesPage'
import DebtsPage from '@/pages/DebtsPage'
import DepositsPage from '@/pages/DepositsPage'
import TransfersPage from '@/pages/TransfersPage'
import AdvisorPage from '@/pages/AdvisorPage'
import SettingsPage from '@/pages/SettingsPage'
import AuthPage from '@/pages/AuthPage'

const HIDE_NAV_PATHS = ['/auth']

function AppLayout() {
  const location = useLocation()
  const hideNav = HIDE_NAV_PATHS.includes(location.pathname)

  return (
    <div className="flex min-h-dvh bg-surface-900 w-full max-w-full overflow-x-hidden">
      {/* ─── Desktop Sidebar ───────────────────────────────── */}
      {!hideNav && (
        <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 xl:w-72 shrink-0">
          <Sidebar />
        </div>
      )}

      {/* ─── Main content area ─────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-dvh w-full min-w-0 max-w-full overflow-x-hidden ${!hideNav ? 'lg:pl-64 xl:pl-72' : ''}`}>
        <Routes>
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/expenses"  element={<ExpensesPage />} />
          <Route path="/debts"     element={<DebtsPage />} />
          <Route path="/deposits"  element={<DepositsPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/advisor"   element={<AdvisorPage />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* ─── Mobile Bottom Nav ─────────────────────────────── */}
      {!hideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient mx-auto mb-4 flex items-center justify-center shadow-glow animate-pulse-glow">
            <svg viewBox="0 0 64 64" className="w-9 h-9">
              <path d="M12 44 L24 28 L36 36 L52 16" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="52" cy="16" r="4" fill="#FBBF24"/>
            </svg>
          </div>
          <p className="text-white/40 text-sm font-medium">Loading FinCraft...</p>
        </div>
      </div>
    )
  }

  return (
    <FinanceProvider>
      <AppLayout />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E1535',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </FinanceProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
