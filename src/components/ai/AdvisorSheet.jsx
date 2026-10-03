import { useState, useRef, useEffect } from 'react'
import {
  streamFinancialAdvice,
  getActiveApiKey,
  saveApiKey,
  clearApiKey,
  getSelectedModel,
  CANDIDATE_MODELS
} from '@/lib/gemini'
import { useFinance } from '@/context/FinanceContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/currency'
import {
  BrainCircuit,
  Send,
  Loader2,
  RotateCcw,
  Sparkles,
  Key,
  ExternalLink,
  CheckCircle,
  Eye,
  EyeOff,
  Zap,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import ModelPickerModal from './ModelPickerModal'

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

  // Key & Model state
  const [activeKey, setActiveKey] = useState(() => getActiveApiKey(user?.id, profile?.gemini_api_key))
  const [selectedModel, setSelectedModel] = useState(() => getSelectedModel(user?.id))
  const [showModelPicker, setShowModelPicker] = useState(false)

  const [inputKey, setInputKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your **FinCraft AI Advisor**. I analyze your real-time expenses, debts, bank balances, and DPS savings to give personalized advice.\n\nWhat would you like to review today?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const key = getActiveApiKey(user?.id, profile?.gemini_api_key)
    setActiveKey(key)
    setSelectedModel(getSelectedModel(user?.id))
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
          console.warn('Could not sync key to Supabase profile:', e)
        }
      }
      setActiveKey(cleanKey)
      setInputKey('')
      setShowKeyInput(false)
      toast.success('Google API key connected! Testing models... ⚡')
      // Prompt user with available models discovery right away
      setShowModelPicker(true)
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

  const currentModelObj = CANDIDATE_MODELS.find(m => m.id === selectedModel) || CANDIDATE_MODELS[0]

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
      let usedModel = selectedModel
      const res = await streamFinancialAdvice(
        text,
        buildContext(),
        (chunk, model) => {
          fullText += chunk
          if (model) usedModel = model
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: fullText,
              streaming: true,
              modelUsed: usedModel
            }
            return updated
          })
        },
        activeKey,
        selectedModel
      )

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: fullText,
          streaming: false,
          modelUsed: res?.modelUsed || usedModel
        }
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
            ? '⚠️ **Invalid API Key**: Google rejected this key. Please check your key at [Google AI Studio](https://aistudio.google.com/app/apikey) and reconnect.'
            : '⚠️ Sorry, Google AI servers are experiencing high load on this model right now. You can switch to another model using the model selector above!',
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
      {/* AI Status Banner with Model Selector */}
      <div className="mx-4 mb-3 glass-card p-3 bg-brand-600/10 border-brand-500/20">
        <div className="flex items-center gap-2.5 justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow shrink-0">
              <BrainCircuit size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => activeKey && setShowModelPicker(true)}
                  className={`text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1 truncate ${
                    activeKey ? 'cursor-pointer hover:underline' : ''
                  }`}
                  title={activeKey ? "Click to scan and select Gemini model" : ""}
                >
                  <span>{currentModelObj.label}</span>
                  {activeKey && <ChevronDown size={12} className="shrink-0 text-brand-400" />}
                </button>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-white/70 hidden sm:inline-block">
                  {currentModelObj.badge}
                </span>
              </div>
              <p className="text-[10px] text-white/50 truncate">
                {activeKey
                  ? user ? `Connected to ${user.email.split('@')[0]}'s Google Key` : 'Connected to your key'
                  : 'Connect your own Google API key'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeKey ? (
              <button
                onClick={() => setShowModelPicker(true)}
                className="flex items-center gap-1 bg-surface-700/80 hover:bg-surface-700 border border-white/10 text-white/80 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
              >
                <Zap size={11} className="text-brand-400" />
                <span>Change Model</span>
              </button>
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
                {showKeyInput ? 'Close' : 'Key'}
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
              Every user connects their own free Google Gemini key so your financial insights remain 100% private to your Google account.
            </p>
            <ol className="text-[11px] text-white/60 list-decimal list-inside space-y-0.5 mb-2.5">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-300 underline font-semibold">aistudio.google.com/app/apikey <ExternalLink size={10} className="inline" /></a> with your Google account.</li>
              <li>Click <strong>"Create API key"</strong> and copy your key.</li>
              <li>Paste it below and click Connect to automatically scan models.</li>
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
                {savingKey ? 'Connecting...' : 'Connect & Scan Models'}
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
                <>
                  <MarkdownText text={msg.content} />
                  {msg.modelUsed && (
                    <div className="mt-2 pt-1 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-white/35">
                      <Zap size={10} className="text-brand-400" />
                      <span>Answered by {msg.modelUsed}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Analyzing with {currentModelObj.label}...</span>
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
            placeholder={activeKey ? `Ask about your expenses, debts, or savings (${currentModelObj.label})...` : "Connect your Google Gemini key above to chat..."}
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

      {/* Model Picker Modal */}
      {showModelPicker && activeKey && (
        <ModelPickerModal
          apiKey={activeKey}
          userId={user?.id}
          onClose={() => setShowModelPicker(false)}
          onSelect={(modelId) => {
            setSelectedModel(modelId)
            setShowModelPicker(false)
          }}
        />
      )}
    </div>
  )
}
