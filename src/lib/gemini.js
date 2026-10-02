import { GoogleGenAI } from '@google/genai'

const STORAGE_KEY = 'fincraft_gemini_api_key'

/**
 * Get active API key: localStorage first, then env var
 */
export function getActiveApiKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim()) return stored.trim()
  } catch {}
  return import.meta.env.VITE_GEMINI_API_KEY || null
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(key) {
  try {
    if (key && key.trim()) localStorage.setItem(STORAGE_KEY, key.trim())
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

/**
 * Remove saved API key
 */
export function clearApiKey() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

let _ai = null
let _lastKey = null

function getClient() {
  const key = getActiveApiKey()
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
 * Stream AI financial advice from Gemini 2.5 Flash
 */
export async function streamFinancialAdvice(prompt, financialContext, onChunk) {
  const client = getClient()
  if (!client) {
    const demoResponse = `**Gemini API Key Required** 🤖\n\nTo get personalized AI advice, add your Gemini API key in **Settings → AI Configuration**.\n\nGet a **free key** at [ai.google.dev](https://ai.google.dev) using your Google account — no credit card needed.\n\n**Free tier includes:**\n- 15 requests/minute\n- 1 million tokens/day\n- Access to Gemini 2.5 Flash`
    onChunk?.(demoResponse)
    return demoResponse
  }

  const contextSummary = financialContext
    ? `\n\nUser's Financial Snapshot:\n${JSON.stringify(financialContext, null, 2)}`
    : ''

  const fullPrompt = `${SYSTEM_PROMPT}${contextSummary}\n\nUser: ${prompt}`

  try {
    const response = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    })
    let fullText = ''
    for await (const chunk of response) {
      const chunkText = chunk.text()
      if (chunkText) {
        fullText += chunkText
        onChunk?.(chunkText)
      }
    }
    return fullText
  } catch (error) {
    console.error('Gemini API error:', error)
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your key in Settings → AI Configuration.')
    }
    throw new Error('AI advisor temporarily unavailable. Please try again.')
  }
}

/**
 * Analyze spending patterns and return risk alerts
 */
export async function analyzeSpendingRisks(financialData) {
  const client = getClient()
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

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
    const text = response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return null
  } catch (error) {
    console.error('Risk analysis error:', error)
    return null
  }
}
