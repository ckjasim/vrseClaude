require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const axios = require('axios')

const BASE_URL  = (process.env.ANTHROPIC_BASE_URL || 'https://openrouter.ai/api').replace(/\/$/, '')
const API_KEY   = process.env.ANTHROPIC_AUTH_TOKEN
const DEFAULT_MODEL = process.env.CREATION_MODEL || 'anthropic/claude-sonnet-4-5'

/**
 * Single-turn LLM call over OpenRouter /v1/chat/completions.
 *
 * @param {object} opts
 * @param {string} opts.systemPrompt
 * @param {string} opts.userMessage
 * @param {boolean} [opts.jsonMode=false]   — sets response_format: { type: 'json_object' }
 * @param {string}  [opts.model]            — overrides CREATION_MODEL env var
 * @param {number}  [opts.maxTokens=8192]
 * @returns {Promise<string>} raw assistant message content
 */
async function chat({ systemPrompt, userMessage, jsonMode = false, model, maxTokens = 8192 }) {
  const payload = {
    model:      model || DEFAULT_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  }
    ]
  }

  if (jsonMode) {
    payload.response_format = { type: 'json_object' }
  }

  const response = await axios.post(
    `${BASE_URL}/v1/chat/completions`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type':  'application/json'
      },
      timeout: 120000
    }
  )

  const content = response.data?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')
  return stripFences(content)
}

function stripFences(text) {
  return text
    .replace(/^```(?:json|JSON)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
}

module.exports = { chat }
