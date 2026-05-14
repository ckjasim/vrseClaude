/**
 * Component 4 — Context Reduction and Output Management
 * Clips the momentChain to only the K most relevant moments before
 * sending anything to the LLM, keeping token costs bounded.
 *
 * Strategy: score each moment by keyword overlap with the query,
 * then take the top K plus their immediate neighbours for continuity.
 */

const DEFAULT_MAX_MOMENTS = 5
const NEIGHBOUR_WINDOW    = 1  // include 1 before + 1 after each hit

/**
 * Return a trimmed subset of momentChain relevant to `query`.
 * Falls back to the first DEFAULT_MAX_MOMENTS moments if no matches.
 *
 * @param {object[]} momentChain  - full chain from buildRelationshipIndex
 * @param {string}   query        - natural language or keyword query
 * @param {number}   maxMoments   - hard cap on moments returned
 * @returns {object[]} clipped chain (same shape, subset of originals)
 */
function clip(momentChain, query, maxMoments = DEFAULT_MAX_MOMENTS) {
  if (!momentChain || momentChain.length <= maxMoments) return momentChain

  const tokens = tokenise(query)
  if (tokens.length === 0) return momentChain.slice(0, maxMoments)

  const scores = momentChain.map((m, i) => ({
    index: i,
    score: scoreMatch(m, tokens)
  }))

  scores.sort((a, b) => b.score - a.score)

  const topHits = scores.slice(0, maxMoments).map(s => s.index)
  const included = new Set()

  for (const hit of topHits) {
    for (let n = Math.max(0, hit - NEIGHBOUR_WINDOW); n <= Math.min(momentChain.length - 1, hit + NEIGHBOUR_WINDOW); n++) {
      included.add(n)
      if (included.size >= maxMoments) break
    }
    if (included.size >= maxMoments) break
  }

  const indices = [...included].sort((a, b) => a - b)
  return indices.map(i => momentChain[i])
}

/**
 * Estimate token cost of a momentChain subset (rough: 1 token ≈ 4 chars).
 */
function estimateTokens(momentChain) {
  const text = JSON.stringify(momentChain)
  return Math.ceil(text.length / 4)
}

/**
 * Return the stable KV-cache prefix.
 * Order matters: most-stable content first so providers cache as much as possible.
 *   1. Story context header  — never changes once loaded
 *   2. Scene awareness text  — never changes within a session
 *   3. Prior edits summary   — grows slowly (last N entries only)
 *
 * @param {string} storyContextHeader
 * @param {string} sessionSummary
 * @param {string} [sceneAwareness]   - raw text from load_scene_awareness (optional)
 */
function buildStablePrefix(storyContextHeader, sessionSummary, sceneAwareness = '') {
  const parts = [
    '=== STORY CONTEXT ===',
    storyContextHeader,
    '',
    '=== PRIOR EDITS ===',
    sessionSummary
  ]

  if (sceneAwareness) {
    parts.splice(2, 0, '', '=== SCENE AWARENESS ===', sceneAwareness)
  }

  return parts.join('\n')
}

function tokenise(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

function scoreMatch(moment, tokens) {
  const haystack = [
    moment.momentName || '',
    moment.momentDescription || '',
    (moment.objects || []).join(' ')
  ].join(' ').toLowerCase()

  return tokens.reduce((sum, t) => sum + (haystack.includes(t) ? 1 : 0), 0)
}

module.exports = { clip, estimateTokens, buildStablePrefix }
