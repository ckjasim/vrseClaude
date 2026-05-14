/**
 * Component 3 — Structured Tools, Validation, and Permissions
 * Thin VrseBuilder-specific wrapper around OpenClaw's tool registration.
 * Adds: blast-radius gate, storyId presence check, unified error format.
 *
 * OpenClaw already handles the outer tool dispatch loop; this layer adds
 * domain-specific guards without reimplementing the framework.
 */
const { getContext } = require('./workspaceContext')

/**
 * Wrap an execute function with standard guards:
 * - storyId loaded check
 * - blast radius threshold (optional)
 * - unified error/ok formatting
 *
 * @param {Function} fn          - async (params, ctx) => any
 * @param {object}   opts
 * @param {boolean}  opts.requireStory  - default true
 * @param {number}   opts.maxBlastRadius - if set, reject if blastRadius(params) > threshold
 * @param {Function} opts.blastRadius    - optional (params, ctx) => number
 * @returns {Function} wrapped execute(id, params)
 */
function guard(fn, opts = {}) {
  const { requireStory = true, maxBlastRadius, blastRadius } = opts

  return async function execute(_id, params) {
    try {
      let ctx = null
      if (requireStory) {
        ctx = getContext(params.storyId)
        if (!ctx) return err('Story not loaded. Call load_story first.')
      }

      if (maxBlastRadius && blastRadius) {
        const radius = blastRadius(params, ctx)
        if (radius > maxBlastRadius) {
          return err(
            `Blast radius ${radius} exceeds threshold ${maxBlastRadius}. ` +
            'Use get_blast_radius to review the impact, then confirm with force:true.'
          )
        }
      }

      const result = await fn(params, ctx)
      return ok(result)
    } catch (e) {
      return err(e.message)
    }
  }
}

function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], details: data }
}

function err(message) {
  const details = { error: message }
  return { content: [{ type: 'text', text: JSON.stringify(details) }], details }
}

module.exports = { guard, ok, err }
