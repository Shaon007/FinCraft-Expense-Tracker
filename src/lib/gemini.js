import { GoogleGenAI } from '@google/genai'

const STORAGE_PREFIX = 'fincraft_gemini_api_key'
const MODEL_STORAGE_PREFIX = 'fincraft_gemini_model'

export const CANDIDATE_MODELS = [
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite', badge: 'Ultra Fast', desc: 'Fastest latency (<1s), ideal for mobile budgeting' },
  { id: 'gemini-3.5-flash',          label: 'Gemini 3.5 Flash',  badge: 'Balanced',   desc: 'Great balance of deep insights and fast speed' },
  { id: 'gemini-3.8-flash',          label: 'Gemini 3.8 Flash',  badge: 'Smartest',   desc: 'Latest high-intelligence reasoning model' },
  { id: 'gemini-flash-latest',       label: 'Gemini Flash',      badge: 'Stable',     desc: 'Standard auto-updating Flash model' },
  { id: 'gemini-pro-latest',         label: 'Gemini Pro',        badge: 'Pro Tier',   desc: 'Deep complex analysis (higher quota requirements)' },
]

/**
 * Get active API key strictly for the current user.
 */
export function getActiveApiKey(userId = null, profileKey = null) {
  try {
    if (profileKey && typeof profileKey === 'string' && profileKey.trim()) {
      return profileKey.trim()
    }
    if (userId) {
      const userKey = localStorage.getItem(`${STORAGE_PREFIX}_${userId}`)
      if (userKey && userKey.trim()) return userKey.trim()
    } else {
      const guestKey = localStorage.getItem(`${STORAGE_PREFIX}_guest`)
      if (guestKey && guestKey.trim()) return guestKey.trim()
    }
    const legacyKey = localStorage.getItem(STORAGE_PREFIX)
    if (legacyKey && legacyKey.trim()) return legacyKey.trim()
  } catch {}
  return null
}

/**
 * Save API key strictly for the current user
 */
export function saveApiKey(key, userId = null) {
  try {
    const cleanKey = key ? key.trim() : ''
    const storageKey = userId ? `${STORAGE_PREFIX}_${userId}` : `${STORAGE_PREFIX}_guest`
    if (cleanKey) {
      localStorage.setItem(storageKey, cleanKey)
      localStorage.setItem(STORAGE_PREFIX, cleanKey)
    } else {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(STORAGE_PREFIX)
    }
  } catch {}
}

/**
 * Remove saved API key for the user
 */
export function clearApiKey(userId = null) {
  try {
    if (userId) localStorage.removeItem(`${STORAGE_PREFIX}_${userId}`)
    localStorage.removeItem(`${STORAGE_PREFIX}_guest`)
    localStorage.removeItem(STORAGE_PREFIX)
  } catch {}
}

/**
 * Get selected model for current user
 */
export function getSelectedModel(userId = null) {
  try {
    const storageKey = userId ? `${MODEL_STORAGE_PREFIX}_${userId}` : MODEL_STORAGE_PREFIX
    const saved = localStorage.getItem(storageKey)
    if (saved && saved.trim()) return saved.trim()
  } catch {}
  return 'gemini-flash-lite-latest'
}

/**
 * Save selected model for current user
 */
export function saveSelectedModel(modelId, userId = null) {
  try {
    const storageKey = userId ? `${MODEL_STORAGE_PREFIX}_${userId}` : MODEL_STORAGE_PREFIX
    if (modelId) {
      localStorage.setItem(storageKey, modelId)
      localStorage.setItem(MODEL_STORAGE_PREFIX, modelId)
    }
  } catch {}
}

let _ai = null
let _lastKey = null

function getClient(apiKey) {
  if (!apiKey) return null
  if (!_ai || _lastKey !== apiKey) {
    _ai = new GoogleGenAI({ apiKey })
    _lastKey = apiKey
  }
  return _ai
}

/**
 * Discover available models for a given Google API key
 * Pings candidates in parallel to detect live status and latency
 */
export async function discoverAvailableModels(apiKey) {
  const client = getClient(apiKey)
  if (!client) return []

  const testList = CANDIDATE_MODELS.map(c => c.id)

  const results = await Promise.all(
    CANDIDATE_MODELS.map(async (item) => {
      const start = Date.now()
      try {
        await Promise.race([
          client.models.generateContent({ model: item.id, contents: 'ping' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3500))
        ])
        return {
          ...item,
          status: 'online',
          latencyMs: Date.now() - start,
        }
      } catch (err) {
        const msg = err?.message || ''
        let reason = 'Busy'
        if (msg.includes('429') || msg.includes('quota')) reason = 'Quota Limit'
        else if (msg.includes('404')) reason = 'Not Supported'
        else if (msg.includes('Timeout')) reason = 'Slow / Busy'
        return {
          ...item,
          status: 'unavailable',
          error: reason,
        }
      }
    })
  )

  return results
}

const SYSTEM_PROMPT = `You are FinCraft AI, an intelligent, concise personal financial advisor.
You provide clear, actionable advice tailored to the user's financial situation.
Format responses with:
- Short bold headers using **text**
- Bullet points for lists
- Concrete numbers when possible
- Keep responses under 250 words unless asked for detail
Never be alarmist, keep insights encouraging and practical.`

/**
 * Stream AI advice with automatic fallback to next available model if selected model is busy
 */
export async function streamFinancialAdvice(prompt, financialContext, onChunk, apiKey, preferredModel = null) {
  const client = getClient(apiKey)
  if (!client) throw new Error('NO_API_KEY')

  const contextSummary = financialContext
    ? `\n\nUser's Financial Snapshot:\n${JSON.stringify(financialContext, null, 2)}`
    : ''

  const fullPrompt = `${SYSTEM_PROMPT}${contextSummary}\n\nUser: ${prompt}`

  const primary = preferredModel || 'gemini-flash-lite-latest'
  const fallbackChain = [
    primary,
    ...CANDIDATE_MODELS.map(c => c.id).filter(id => id !== primary)
  ]

  let lastError = null

  for (const model of fallbackChain) {
    try {
      const response = await client.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      })
      let fullText = ''
      for await (const chunk of response) {
        const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '')
        if (chunkText) {
          fullText += chunkText
          onChunk?.(chunkText, model)
        }
      }
      if (fullText) return { text: fullText, modelUsed: model }
    } catch (error) {
      console.warn(`Model ${model} stream attempt failed, attempting fallback:`, error?.message)
      lastError = error
      if (
        error?.message?.includes('API_KEY_INVALID') ||
        error?.message?.includes('API key not valid')
      ) {
        throw new Error('Invalid Gemini API key. Please check your key at Google AI Studio.')
      }
    }
  }

  throw new Error(lastError?.message || 'Google AI servers are currently busy. Please try again in a moment.')
}

/**
 * Analyze spending risks with fallback
 */
export async function analyzeSpendingRisks(financialData, apiKey, preferredModel = null) {
  const client = getClient(apiKey)
  if (!client) return null

  const prompt = `${SYSTEM_PROMPT}

Analyze this financial data and return a JSON object with spending risk alerts:
${JSON.stringify(financialData, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "riskLevel": "low" | "medium" | "high",
  "alerts": [
    { "category": string, "message": string, "severity": "info"|"warning"|"danger" }
  ],
  "topInsight": string
}`

  const primary = preferredModel || 'gemini-flash-lite-latest'
  const fallbackChain = [
    primary,
    ...CANDIDATE_MODELS.map(c => c.id).filter(id => id !== primary)
  ]

  for (const model of fallbackChain) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      const text = typeof response.text === 'function' ? response.text() : (response.text || '')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.warn(`Model ${model} risk analysis attempt failed:`, error?.message)
    }
  }

  return null
}
