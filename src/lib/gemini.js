import { GoogleGenAI } from '@google/genai'

const STORAGE_KEY = 'fincraft_gemini_api_key'

/**
 * Get active API key:
 * 1. User-specific key from localStorage (if userId provided)
 * 2. General localStorage key
 * 3. Environment variable (VITE_GEMINI_API_KEY)
 */
export function getActiveApiKey(userId = null) {
  try {
    if (userId) {
      const userKey = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      if (userKey && userKey.trim()) return userKey.trim()
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim()) return stored.trim()
  } catch {}
  return import.meta.env.VITE_GEMINI_API_KEY || null
}

/**
 * Save API key to localStorage (tied to user if userId provided)
 */
export function saveApiKey(key, userId = null) {
  try {
    const cleanKey = key ? key.trim() : ''
    if (userId) {
      if (cleanKey) localStorage.setItem(`${STORAGE_KEY}_${userId}`, cleanKey)
      else localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
    }
    // Also save as current active key
    if (cleanKey) localStorage.setItem(STORAGE_KEY, cleanKey)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

/**
 * Remove saved API key
 */
export function clearApiKey(userId = null) {
  try {
    if (userId) localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

let _ai = null
let _lastKey = null

function getClient(userId = null) {
  const key = getActiveApiKey(userId)
  if (!key) return null
  if (!_ai || _lastKey !== key) {
    _ai = new GoogleGenAI({ apiKey: key })
    _lastKey = key
  }
  return _ai
}

const SYSTEM_PROMPT = `You are FinCraft AI, a friendly and insightful personal financial advisor.
You provide concise, actionable advice tailored to the user's financial situation.
Always be encouraging, specific, and data-driven. Format responses with:
- Short bold headers using **text**
- Bullet points for lists
- Concrete numbers when possible
- Keep responses under 300 words unless asked for detail
Never be alarmist but do flag genuine risks clearly.`

/**
 * Stream AI financial advice from Gemini with robust model fallback
 */
export async function streamFinancialAdvice(prompt, financialContext, onChunk, userId = null) {
  const client = getClient(userId)
  if (!client) {
    const demoResponse = `**Gemini API Key Required** 🤖\n\nTo get personalized AI financial advice, please connect your Gemini API key in **Settings → AI Configuration**.\n\n### How to get your free key in 30 seconds:\n1. Open [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) in your browser.\n2. Sign in with your Google account.\n3. Click **"Create API key"** and copy the code starting with \`AIzaSy...\`\n4. Paste it in FinCraft **Settings**.\n\n*Note: Free tier gives 15 requests/minute at no cost.*`
    onChunk?.(demoResponse)
    return demoResponse
  }

  const contextSummary = financialContext
    ? `\n\nUser's Financial Snapshot:\n${JSON.stringify(financialContext, null, 2)}`
    : ''

  const fullPrompt = `${SYSTEM_PROMPT}${contextSummary}\n\nUser: ${prompt}`

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  let lastError = null

  for (const model of models) {
    try {
      const response = await client.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      })
      let fullText = ''
      for await (const chunk of response) {
        // chunk.text can be a string property or method in different SDK versions
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
      if (error?.message?.includes('API key') || error?.status === 400 || error?.status === 403) {
        throw new Error('Invalid Gemini API key. Please check your key in Settings → AI Configuration.')
      }
    }
  }

  throw new Error(lastError?.message || 'AI advisor temporarily unavailable. Please verify your Gemini API key.')
}

/**
 * Analyze spending patterns and return risk alerts
 */
export async function analyzeSpendingRisks(financialData, userId = null) {
  const client = getClient(userId)
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

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']

  for (const model of models) {
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
