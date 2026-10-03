import { useState, useEffect } from 'react'
import { CANDIDATE_MODELS, discoverAvailableModels, getSelectedModel, saveSelectedModel } from '@/lib/gemini'
import { X, Check, RefreshCw, Zap, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ModelPickerModal({ apiKey, userId, onClose, onSelect }) {
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState([])
  const [selectedId, setSelectedId] = useState(() => getSelectedModel(userId))

  const runDiscovery = async () => {
    if (!apiKey) return
    setLoading(true)
    try {
      const results = await discoverAvailableModels(apiKey)
      setModels(results)

      // If current selection is not online, auto-pick the fastest online model
      const currentStatus = results.find(r => r.id === selectedId)
      if (!currentStatus || currentStatus.status !== 'online') {
        const fastestOnline = results.find(r => r.status === 'online')
        if (fastestOnline) {
          setSelectedId(fastestOnline.id)
          saveSelectedModel(fastestOnline.id, userId)
          onSelect?.(fastestOnline.id)
        }
      }
    } catch (err) {
      toast.error('Failed to scan models')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiscovery()
  }, [apiKey])

  const handleChoose = (modelId) => {
    setSelectedId(modelId)
    saveSelectedModel(modelId, userId)
    onSelect?.(modelId)
    toast.success(`Active model updated! ⚡`)
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-5 pb-6 max-h-[90dvh] overflow-y-auto scrollbar-hide max-w-lg mx-auto">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-brand-400" />
              Select Active Gemini Model
            </h2>
            <p className="text-xs text-white/50">
              Live latency & availability on your Google API key
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={runDiscovery}
              disabled={loading}
              title="Rescan models"
              className="w-8 h-8 rounded-lg bg-surface-700 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-700 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-white/60 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-brand-400" />
            <p>Testing live models on your Google key...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-2.5 mb-5">
            {(models.length ? models : CANDIDATE_MODELS).map((m) => {
              const isSelected = selectedId === m.id
              const isOnline = m.status === 'online'

              return (
                <div
                  key={m.id}
                  onClick={() => handleChoose(m.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/15 shadow-sm ring-1 ring-brand-500'
                      : 'border-white/10 bg-surface-700/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-white">{m.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 truncate">{m.desc}</p>
                    {m.status && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                        {isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
                            <span className="text-success-400 font-medium">
                              Online · {m.latencyMs}ms response
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-warning-400" />
                            <span className="text-warning-400 font-medium">
                              {m.error || 'High Load'} (Auto-failover supported)
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-brand-400 bg-brand-500 text-white'
                        : 'border-white/20 bg-surface-800'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="p-3 bg-brand-600/10 rounded-xl border border-brand-500/20 text-xs text-white/70 space-y-1">
          <p className="font-semibold text-brand-300 flex items-center gap-1">
            <ShieldCheck size={13} /> Zero-Downtime Auto Failover
          </p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            If Google's free tier experiences a temporary spike on your selected model, FinCraft automatically fails over to the next online model so you never see an error message.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full btn-primary mt-4 text-xs py-2.5"
        >
          Confirm & Save Model
        </button>
      </div>
    </>
  )
}
