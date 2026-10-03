import { useState, useRef, useEffect } from 'react'
import { streamFinancialAdvice, getActiveApiKey, saveApiKey, clearApiKey } from '@/lib/gemini'
import { useFinance } from '@/context/FinanceContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/currency'
import { BrainCircuit, Send, Loader2, RotateCcw, Sparkles, Key, ExternalLink, CheckCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const SUGGESTED_PROMPTS = [
  "How can I improve my savings rate?",
  "Am I spending too much on food & dining?",
  "How can I pay off my debts faster?",
  "Where should I cut my monthly expenses?",
  "How should I invest my savings?",
  "Create a budget plan for this month",
]

function MarkdownText({ text }) {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-300">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '&#8226; ')
    .replace(/^- /gm, '&#8226; ')
    .replace(/\n/g, '<br/>')
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />
}

export default function AdvisorSheet() {
  const { metrics, currency } = useFinance()
  const { user, profile, updateProfile } = useAuth()

  // Key state
  const [activeKey, setActiveKey] = useState(() => getActiveApiKey(user?.id, profile?.gemini_api_key))
  const [inputKey, setInputKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your **FinCraft AI Advisor** (powered by Gemini 3.8 Flash). I analyze your real-time expenses, debts, bank accounts, and DPS savings to give personalized financial advice.\n\nWhat would you like to review today?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const key = getActiveApiKey(user?.id, profile?.gemini_api_key)
    setActiveKey(key)
  }, [user, profile])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSaveInlineKey = async (e) => {
    e?.preventDefault()
    if (!inputKey.trim()) {
      toast.error('Please enter an API key')
      return
    }
    if (!inputKey.startsWith('AIza')) {
      toast.error('Invalid key. Google AI Studio keys start with AIzaSy...')
      return
    }

    setSavingKey(true)
    try {
      const cleanKey = inputKey.trim()
      saveApiKey(cleanKey, user?.id)
      if (user && updateProfile) {
        try {
          await updateProfile({ gemini_api_key: cleanKey })
        } catch (e) {
          console.warn('Could not sync key to Supabase profile (column may not exist yet), saved locally:', e)
        }
      }
      setActiveKey(cleanKey)
      setInputKey('')
      setShowKeyInput(false)
      toast.success('Your Gemini API key is connected! 🤖')
    } catch (err) {
      toast.error(err.message || 'Failed to save key')
    } finally {
      setSavingKey(false)
    }
  }

  const handleRemoveKey = async () => {
    clearApiKey(user?.id)
    if (user && updateProfile) {
      try {
        await updateProfile({ gemini_api_key: null })
      } catch {}
    }
    setActiveKey(null)
    toast.success('API key removed')
  }

  const buildContext = () => ({
    monthlyIncome: formatCurrency(metrics.totalIncome, currency),
    monthlyExpense: formatCurrency(metrics.totalExpense, currency),
    netCash: formatCurrency(metrics.netCash, currency),
    totalSavings: formatCurrency(metrics.totalSavings, currency),
    totalDebt: formatCurrency(metrics.totalOwed, currency),
    netWorth: formatCurrency(metrics.netWorth, currency),
    savingsRate: `${metrics.savingsRate.toFixed(1)}%`,
    topCategories: metrics.categoryBreakdown.slice(0, 4).map(c => `${c.name}: ${formatCurrency(c.spent, currency)}`),
  })

  const sendMessage = async (promptText) => {
    const text = promptText || input.trim()
    if (!text || loading) return

    if (!activeKey) {
      setShowKeyInput(true)
      toast.error('Please connect your own Google Gemini API key first')
      return
    }

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Add placeholder AI message
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      let fullText = ''
      await streamFinancialAdvice(text, buildContext(), (chunk) => {
        fullText += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: true }
          return updated
        })
      }, activeKey)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: false }
        return updated
      })
    } catch (err) {
      const msg = err.message || ''
      toast.error('AI error: ' + msg)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: msg.includes('Invalid Gemini API key')
            ? '⚠️ **Invalid API Key**: Google rejected this API key. Please check your key at [Google AI Studio](https://aistudio.google.com/app/apikey) and reconnect.'
            : '⚠️ Sorry, I encountered an error connecting to Gemini. Please verify your internet connection or check your API key.',
          streaming: false,
        }
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! Ask me anything about your expenses, budgeting, or savings goals.",
    }])
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Status Banner */}
      <div className="mx-4 mb-3 glass-card p-3 bg-brand-600/10 border-brand-500/20">
        <div className="flex items-center gap-2.5 justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow shrink-0">
              <BrainCircuit size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-300 truncate">Gemini 3.8 Flash</p>
              <p className="text-[10px] text-white/50 truncate">
                {activeKey
                  ? user ? `Connected to ${user.email.split('@')[0]}'s Google Key` : 'Connected to your key'
                  : 'Connect your own Google API key'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeKey ? (
              <div className="flex items-center gap-1.5 bg-success-500/15 text-success-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <CheckCircle size={10} />
                <span>Active</span>
              </div>
            ) : (
              <button
                onClick={() => setShowKeyInput(true)}
                className="text-[10px] font-bold text-brand-300 bg-brand-500/20 px-2.5 py-1 rounded-lg border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
              >
                + Connect Key
              </button>
            )}

            {activeKey && (
              <button
                onClick={() => setShowKeyInput(prev => !prev)}
                className="text-[10px] text-white/40 hover:text-white underline ml-1"
              >
                {showKeyInput ? 'Close' : 'Manage'}
              </button>
            )}
          </div>
        </div>

        {/* Inline Key Connection Drawer */}
        {(!activeKey || showKeyInput) && (
          <div className="mt-3 pt-3 border-t border-white/10 text-xs">
            <p className="text-white/80 font-semibold mb-1">
              🔑 {activeKey ? 'Update your Google Gemini API Key' : 'Connect Your Own Google Account (Free)'}
            </p>
            <p className="text-[11px] text-white/50 mb-2 leading-relaxed">
              To keep each user's financial insights 100% private, every user connects their own free Google Gemini API key:
            </p>
            <ol className="text-[11px] text-white/60 list-decimal list-inside space-y-0.5 mb-2.5">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-300 underline font-semibold">aistudio.google.com/app/apikey <ExternalLink size={10} className="inline" /></a> with your Google account.</li>
              <li>Click <strong>"Create API key"</strong> and copy your key.</li>
              <li>Paste it below and click Connect.</li>
            </ol>

            <form onSubmit={handleSaveInlineKey} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Key size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  className="input-field pl-8 pr-8 py-1.5 text-xs font-mono"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={savingKey || !inputKey.trim()}
                className="btn-primary text-xs py-1.5 px-3 shrink-0"
              >
                {savingKey ? 'Saving...' : 'Connect AI'}
              </button>
              {activeKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="btn-secondary text-xs py-1.5 px-2.5 text-danger-400 border-danger-500/20 shrink-0"
                >
                  Remove
                </button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-hide pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            {msg.role === 'assistant' ? (
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 mt-1 shadow-glow">
                <BrainCircuit size={13} className="text-white" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-surface-600 flex items-center justify-center shrink-0 mt-1 text-xs font-bold text-white">
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'glass-card text-white/85 rounded-tl-sm'
            }`}>
              {msg.content ? (
                <MarkdownText text={msg.content} />
              ) : (
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Analyzing your finances with Gemini 3.8...</span>
                </div>
              )}
              {msg.streaming && msg.content && (
                <span className="inline-block w-0.5 h-4 bg-brand-400 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested prompts (only at start) */}
      {messages.length <= 1 && (
        <div className="px-4 mb-3">
          <p className="text-xs text-white/40 mb-2 flex items-center gap-1.5">
            <Sparkles size={11} className="text-gold-400" /> Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.slice(0, 4).map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="text-xs text-brand-300 bg-brand-600/10 border border-brand-500/20 
                           px-3 py-1.5 rounded-full hover:bg-brand-600/20 transition-colors">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 items-end glass-card p-2">
          <textarea
            ref={inputRef}
            id="ai-advisor-input"
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={activeKey ? "Ask about your expenses, debts, or savings..." : "Connect your Google Gemini key above to chat..."}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none
                       focus:outline-none py-1.5 px-2 max-h-24 scrollbar-hide"
          />
          <div className="flex gap-1 shrink-0">
            <button onClick={clearChat}
              className="w-8 h-8 rounded-lg text-white/30 hover:text-white/60 flex items-center justify-center transition-colors">
              <RotateCcw size={14} />
            </button>
            <button
              id="btn-send-ai"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                input.trim() && !loading
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'bg-surface-600 text-white/30'
              }`}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
