import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useFinance } from '@/context/FinanceContext'
import { CURRENCIES } from '@/lib/currency'
import { getActiveApiKey, saveApiKey, clearApiKey, getSelectedModel, CANDIDATE_MODELS } from '@/lib/gemini'
import {
  LogOut, Globe, ChevronRight, Shield, Bell, Star, Info,
  BrainCircuit, Key, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, User, Palette, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/common/Header'
import ModelPickerModal from '@/components/ai/ModelPickerModal'

function SectionTitle({ children }) {
  return <p className="label-text px-1 mt-5 mb-2">{children}</p>
}

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { isDemoMode } = useFinance()
  const [updating, setUpdating] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(profile?.currency || 'USD')

  // Gemini API key state & model state
  const [geminiKey, setGeminiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [selectedModel, setSelectedModel] = useState(() => getSelectedModel(user?.id))
  const [showModelPicker, setShowModelPicker] = useState(false)

  useEffect(() => {
    const key = getActiveApiKey(user?.id, profile?.gemini_api_key)
    if (key) { setGeminiKey(key); setKeySaved(true) }
    else { setGeminiKey(''); setKeySaved(false) }
    setSelectedModel(getSelectedModel(user?.id))
  }, [user, profile])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out. You can now log into another account.')
  }

  const handleCurrencyChange = async (code) => {
    setSelectedCurrency(code)
    if (!isDemoMode && user) {
      setUpdating(true)
      try { await updateProfile({ currency: code }); toast.success('Currency updated!') }
      catch { toast.error('Failed to update') }
      finally { setUpdating(false) }
    }
  }

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) { toast.error('Please enter an API key'); return }
    if (!geminiKey.startsWith('AIza')) { toast.error('Invalid key. Google AI Studio keys start with AIzaSy...'); return }
    const cleanKey = geminiKey.trim()
    saveApiKey(cleanKey, user?.id)
    if (user && updateProfile) {
      try {
        await updateProfile({ gemini_api_key: cleanKey })
      } catch (e) {
        console.warn('Profile sync fallback:', e)
      }
    }
    setKeySaved(true)
    toast.success('Gemini API key saved! 🤖 Testing available models...')
    setShowModelPicker(true)
  }

  const handleClearGeminiKey = async () => {
    clearApiKey(user?.id)
    if (user && updateProfile) {
      try {
        await updateProfile({ gemini_api_key: null })
      } catch {}
    }
    setGeminiKey('')
    setKeySaved(false)
    toast.success('API key removed from your account')
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest'

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" subtitle="Preferences & configuration" />

      <div className="page-container lg:max-w-2xl pt-4">
        {/* Profile & Multi-User Card */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-black text-white shadow-glow shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-lg truncate">{displayName}</p>
              <p className="text-xs text-white/50 truncate">{user?.email || 'Demo mode (Not signed in)'}</p>
              <div className="flex items-center gap-2 mt-1">
                {user ? (
                  <span className="badge badge-success text-[10px]">Private Account Active</span>
                ) : (
                  <span className="badge badge-warning text-[10px]">Shared Demo Mode</span>
                )}
              </div>
            </div>
            {!user ? (
              <a href="/auth" className="btn-primary text-xs px-4 py-2 shrink-0">Sign In / Register</a>
            ) : (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-700 text-white/70 hover:text-white border border-white/10 shrink-0"
              >
                Switch Account
              </button>
            )}
          </div>

          {/* Multi-user guidance */}
          <div className="mt-4 pt-3 border-t border-white/5">
            {user ? (
              <p className="text-[11px] text-white/50 leading-relaxed">
                🔒 <strong>Separate Accounts:</strong> All your transactions, debts, bank balances, and DPS plans are stored in your private Supabase profile. When someone else signs in with their email, they will have their own independent financial data and AI advisor.
              </p>
            ) : (
              <div className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-3 text-xs text-warning-300">
                <p className="font-bold mb-1">💡 Want separate records for different people?</p>
                <p className="text-white/70 text-[11px] mb-2 leading-relaxed">
                  FinCraft has full multi-user support! Each user can sign up with their own email. Their expenses, bank balances, debts, and AI keys are completely isolated from yours.
                </p>
                <a href="/auth" className="inline-flex items-center gap-1 font-bold text-brand-300 hover:underline">
                  Create / Sign In to your account →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ─── GEMINI AI CONFIGURATION ─── */}
        <SectionTitle>🤖 AI Configuration (Gemini)</SectionTitle>
        <div className="glass-card overflow-hidden">
          {/* Status row */}
          <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
              <BrainCircuit size={17} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Gemini 3.8 Flash</p>
              <p className="text-xs text-white/40">Personalized AI Financial Advisor</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              keySaved ? 'bg-success-500/15 text-success-400' : 'bg-warning-500/15 text-warning-400'
            }`}>
              {keySaved ? <CheckCircle size={11} /> : <XCircle size={11} />}
              {keySaved ? 'Connected (Your Account)' : 'Not Set'}
            </div>
          </div>

          {/* Info box */}
          <div className="px-4 py-3.5 bg-brand-600/10 border-b border-white/5 space-y-2">
            <p className="text-xs text-white/70 leading-relaxed">
              💡 <strong>Each user connects their own Google API Key:</strong> Your key is strictly linked to your account. Other users who log in will connect their own key, so nobody uses your quota or sees your financial conversations.
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed">
              1. Open Google AI Studio using your Google/Gmail account.<br/>
              2. Click <strong>"Create API key"</strong>.<br/>
              3. Copy the key (starts with <code className="text-brand-300">AIzaSy...</code>) and paste it below.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 pt-1 text-xs text-brand-300 font-bold hover:text-brand-200 transition-colors"
            >
              <ExternalLink size={12} />
              Open Google AI Studio → Get Your Free API Key
            </a>
          </div>

          {/* Key input */}
          <div className="px-4 py-4">
            <label className="label-text">API Key</label>
            <div className="relative mb-3">
              <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="gemini-api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); setKeySaved(false) }}
                className="input-field pl-9 pr-10 font-mono text-sm"
                autoComplete="off"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-save-gemini-key"
                onClick={handleSaveGeminiKey}
                disabled={!geminiKey.trim() || keySaved}
                className={`flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-1.5 ${
                  !geminiKey.trim() || keySaved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Key size={14} />
                {keySaved ? 'Key Saved ✓' : 'Save & Check Models'}
              </button>
              {keySaved && (
                <button
                  onClick={handleClearGeminiKey}
                  className="btn-secondary text-sm py-2.5 px-4 text-danger-400 border-danger-500/30"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Model Selection Row */}
            {keySaved && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/50">Active Model</p>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                    <Zap size={14} className="text-brand-400 shrink-0" />
                    <span>{CANDIDATE_MODELS.find(m => m.id === selectedModel)?.label || selectedModel}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModelPicker(true)}
                  className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/30 text-xs font-semibold shrink-0 transition-colors"
                >
                  Scan & Switch Model ⚡
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Picker Modal */}
        {showModelPicker && geminiKey && (
          <ModelPickerModal
            apiKey={geminiKey}
            userId={user?.id}
            onClose={() => setShowModelPicker(false)}
            onSelect={(modelId) => {
              setSelectedModel(modelId)
              setShowModelPicker(false)
            }}
          />
        )}

        {/* ─── CURRENCY ─── */}
        <SectionTitle>💱 Default Currency</SectionTitle>
        <div className="glass-card overflow-hidden">
          <div className="max-h-52 overflow-y-auto scrollbar-hide divide-y divide-white/5">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${
                  selectedCurrency === c.code ? 'bg-brand-600/10' : ''
                }`}
              >
                <span className="text-xl">{c.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-white/40">{c.code} · {c.symbol}</p>
                </div>
                {selectedCurrency === c.code && (
                  <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 12 9" className="w-3 h-3" fill="none">
                      <path d="M1 4.5l3.5 3.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── APP SETTINGS ─── */}
        <SectionTitle>⚙️ App Preferences</SectionTitle>
        <div className="glass-card overflow-hidden mb-4">
          {[
            { icon: Bell,    label: 'Notifications',       sub: 'Budget alerts & reminders' },
            { icon: Shield,  label: 'Privacy & Security',  sub: 'Data protection' },
            { icon: Palette, label: 'Appearance',          sub: 'Dark mode (default)' },
            { icon: Globe,   label: 'Language',            sub: 'English (US)' },
            { icon: Star,    label: 'Rate FinCraft',       sub: 'Share feedback' },
            { icon: Info,    label: 'About',               sub: 'v1.0.0 · Built with ❤️' },
          ].map(({ icon: Icon, label, sub }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-white/60" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-white/30" />
            </button>
          ))}
        </div>

        {/* Sign Out */}
        {user && (
          <button id="btn-sign-out" onClick={handleSignOut}
            className="w-full btn-danger flex items-center justify-center gap-2 mb-4">
            <LogOut size={16} /> Sign Out
          </button>
        )}

        <p className="text-center text-xs text-white/20 pb-4">
          FinCraft v1.0 · Zero-cost PWA · React + Supabase + Gemini
        </p>
      </div>
    </div>
  )
}
