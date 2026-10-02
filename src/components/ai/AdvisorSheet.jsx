import { useState, useRef, useEffect } from 'react'
import { streamFinancialAdvice } from '@/lib/gemini'
import { useFinance } from '@/context/FinanceContext'
import { formatCurrency } from '@/lib/currency'
import { BrainCircuit, Send, Loader2, RotateCcw, Sparkles, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const SUGGESTED_PROMPTS = [
  "How can I improve my savings rate?",
  "Am I spending too much on food?",
  "How can I pay off my debts faster?",
  "Where should I cut my expenses?",
  "How should I invest my savings?",
  "Create a budget plan for next month",
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
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your **FinCraft AI Advisor**. I can analyze your spending, help you budget better, and give personalized financial advice.\n\nWhat would you like to know today?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const buildContext = () => ({
    monthlyIncome: formatCurrency(metrics.totalIncome, currency),
    monthlyExpense: formatCurrency(metrics.totalExpense, currency),
    netCash: formatCurrency(metrics.netCash, currency),
    totalSavings: formatCurrency(metrics.totalSavings, currency),
    totalDebt: formatCurrency(metrics.totalOwed, currency),
    netWorth: formatCurrency(metrics.netWorth, currency),
    savingsRate: `${metrics.savingsRate.toFixed(1)}%`,
    topCategories: metrics.categoryBreakdown.slice(0, 3).map(c => `${c.name}: ${formatCurrency(c.spent, currency)}`),
  })

  const sendMessage = async (promptText) => {
    const text = promptText || input.trim()
    if (!text || loading) return

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
      })
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: false }
        return updated
      })
    } catch (err) {
      toast.error('AI error: ' + err.message)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.' }
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
      content: "Chat cleared! What would you like to discuss about your finances?",
    }])
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Status Banner */}
      <div className="mx-4 mb-4 glass-card p-3 bg-brand-600/10 border-brand-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-brand-300">Gemini 2.5 Flash</p>
            <p className="text-[10px] text-white/40">Personalized financial AI · Your data stays private</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
            <span className="text-[10px] text-success-400 font-medium">Ready</span>
          </div>
        </div>
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
                Y
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'glass-card text-white/85 rounded-tl-sm'
            }`}>
              {msg.content ? (
                <MarkdownText text={msg.content} />
              ) : (
                <div className="flex items-center gap-2 text-white/50">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Thinking...</span>
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
            placeholder="Ask about your finances..."
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
