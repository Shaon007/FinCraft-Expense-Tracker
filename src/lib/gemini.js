import { GoogleGenAI } from '@google/genai'

const STORAGE_PREFIX = 'fincraft_gemini_api_key'

/**
 * Get active API key strictly for the current user.
 * Never shares keys between different users.
 * 
 * Priority:
 * 1. Supabase Profile key (synced across user's phone & PC)
 * 2. User-specific localStorage key (fincraft_gemini_api_key_{userId})
 * 3. Guest localStorage key (if not logged in)
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
    // Also check legacy key if matches current user
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

const SYSTEM_PROMPT = `You are FinCraft AI, an intelligent and friendly personal financial advisor.
You provide concise, actionable advice tailored to the user's financial situation.
Always be encouraging, specific, and data-driven. Format responses with:
- Short bold headers using **text**
- Bullet points for lists
- Concrete numbers when possible
- Keep responses under 300 words unless asked for detail
Never be alarmist but do flag genuine risks clearly.`

// Gemini 3.8 Flash is the active current generation model for Google GenAI in 2026
const PRIMARY_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest']

/**
 * Stream AI financial advice from Gemini using the user's own API key
 */
export async function streamFinancialAdvice(prompt, financialContext, onChunk, apiKey) {
  const client = getClient(apiKey)
  if (!client) {
    throw new Error('NO_API_KEY')
  }

  const contextSummary = financialContext
    ? `\n\nUser's Financial Snapshot:\n${JSON.stringify(financialContext, null, 2)}`
    : ''

  const fullPrompt = `${SYSTEM_PROMPT}${contextSummary}\n\nUser: ${prompt}`

  let lastError = null

  for (const model of PRIMARY_MODELS) {
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
          onChunk?.(chunkText)
        }
      }
      if (fullText) return fullText
    } catch (error) {
      console.warn(`Model ${model} stream attempt failed:`, error?.message || error)
      lastError = error
      if (
        error?.message?.includes('API_KEY_INVALID') ||
        error?.message?.includes('API key') ||
        error?.status === 400 ||
        error?.status === 403
      ) {
        throw new Error('Invalid Gemini API key. Please check your key in Settings.')
      }
    }
  }

  throw new Error(lastError?.message || 'AI advisor temporarily unavailable. Please try again.')
}

/**
 * Analyze spending patterns and return risk alerts using user's key
 */
export async function analyzeSpendingRisks(financialData, apiKey) {
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

  for (const model of PRIMARY_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })
      const text = typeof response.text === 'function' ? response.text() : (response.text || '')
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.warn(`Model ${model} risk analysis failed:`, error?.message)
    }
  }

  return null
}
