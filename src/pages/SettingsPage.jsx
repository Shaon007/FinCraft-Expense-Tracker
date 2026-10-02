import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useFinance } from '@/context/FinanceContext'
import { CURRENCIES } from '@/lib/currency'
import { getActiveApiKey, saveApiKey, clearApiKey } from '@/lib/gemini'
import {
  LogOut, Globe, ChevronRight, Shield, Bell, Star, Info,
  BrainCircuit, Key, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, User, Palette
} from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/common/Header'

function SectionTitle({ children }) {
  return <p className="label-text px-1 mt-5 mb-2">{children}</p>
}

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const { isDemoMode } = useFinance()
  const [updating, setUpdating] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(profile?.currency || 'USD')

  // Gemini API key state
  const [geminiKey, setGeminiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  useEffect(() => {
    const key = getActiveApiKey()
    if (key) { setGeminiKey(key); setKeySaved(true) }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
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

  const handleSaveGeminiKey = () => {
    if (!geminiKey.trim()) { toast.error('Please enter an API key'); return }
    if (!geminiKey.startsWith('AIza')) { toast.error('This doesn\'t look like a valid Gemini API key'); return }
    saveApiKey(geminiKey.trim())
    setKeySaved(true)
    toast.success('Gemini API key saved! 🤖 AI Advisor is now active.')
  }

  const handleClearGeminiKey = () => {
    clearApiKey()
    setGeminiKey('')
    setKeySaved(false)
    toast.success('API key removed')
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest'

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" subtitle="Preferences & configuration" />

      <div className="page-container lg:max-w-2xl pt-4">
        {/* Profile Card */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-black text-white shadow-glow shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-lg truncate">{displayName}</p>
            <p className="text-xs text-white/40 truncate">{user?.email || 'Demo mode – not signed in'}</p>
            {isDemoMode && <span className="badge badge-warning mt-1">Demo Mode</span>}
          </div>
          {!user && (
            <a href="/auth" className="btn-primary text-xs px-4 py-2 shrink-0">Sign In</a>
          )}
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
              <p className="text-sm font-semibold text-white">Gemini 2.5 Flash</p>
              <p className="text-xs text-white/40">Powers your AI Financial Advisor</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              keySaved ? 'bg-success-500/15 text-success-400' : 'bg-warning-500/15 text-warning-400'
            }`}>
              {keySaved ? <CheckCircle size={11} /> : <XCircle size={11} />}
              {keySaved ? 'Connected' : 'Not Set'}
            </div>
          </div>

          {/* Info box */}
          <div className="px-4 py-3 bg-brand-600/5 border-b border-white/5">
            <p className="text-xs text-white/60 leading-relaxed">
              Get a <strong className="text-brand-300">free API key</strong> from Google AI Studio using your Gmail account.
              Free tier: <strong className="text-white">15 req/min · 1M tokens/day</strong> — enough for daily use.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand-400 font-semibold hover:text-brand-300 transition-colors"
            >
              <ExternalLink size={11} />
              Open Google AI Studio → Get API Key
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
                {keySaved ? 'Key Saved ✓' : 'Save API Key'}
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
          </div>
        </div>

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
