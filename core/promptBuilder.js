/**
 * Component 2 — Prompt Shape and Cache Reuse
 * Builds structured prompts that maximise KV-cache reuse across turns.
 *
 * Rule: stable content (story header, session summary, VR rules) goes FIRST
 * so providers can cache it. Dynamic content (current task, selected moments)
 * goes LAST — it's the only part that changes each turn.
 */
const { buildStablePrefix } = require('./contextReducer')

/**
 * Build the full prompt for an edit task.
 *
 * @param {object}   opts
 * @param {string}   opts.storyContextHeader  - ~200-token story overview
 * @param {string}   opts.sessionSummary      - recent changes from sessionStore
 * @param {string}   opts.vrRules             - content of vrsebuilder-rules.md
 * @param {string}   opts.task                - the specific edit instruction
 * @param {object[]} opts.relevantMoments     - clipped moment chain from contextReducer
 * @param {string[]} opts.objectCatalog       - valid Query names
 * @param {string}   [opts.sceneAwareness]    - raw scene text from load_scene_awareness
 * @returns {{ systemPrefix: string, userMessage: string }}
 */
function buildEditPrompt({ storyContextHeader, sessionSummary, vrRules, task, relevantMoments, objectCatalog, sceneAwareness = '' }) {
  const systemPrefix = [
    buildStablePrefix(storyContextHeader, sessionSummary, sceneAwareness),
    '',
    '=== VR RULES ===',
    vrRules,
    '',
    '=== VALID OBJECT CATALOG ===',
    objectCatalog.join(', ')
  ].join('\n')

  const userMessage = [
    '=== TASK ===',
    task,
    '',
    '=== RELEVANT MOMENTS ===',
    JSON.stringify(relevantMoments, null, 2)
  ].join('\n')

  return { systemPrefix, userMessage }
}

/**
 * Build a minimal context prompt for read-only queries (search, chain context).
 * Skips moments payload entirely.
 */
function buildQueryPrompt({ storyContextHeader, sessionSummary, query, sceneAwareness = '' }) {
  const systemPrefix = buildStablePrefix(storyContextHeader, sessionSummary, sceneAwareness)
  return { systemPrefix, userMessage: query }
}

/**
 * Rough token estimate for the full prompt.
 */
function estimatePromptTokens({ systemPrefix, userMessage }) {
  return Math.ceil((systemPrefix.length + userMessage.length) / 4)
}

module.exports = { buildEditPrompt, buildQueryPrompt, estimatePromptTokens }
