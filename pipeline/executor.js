/**
 * Executor — atomic apply with snapshot rollback.
 *
 * Flow:
 *   snapshot → merkle verify → validate → applyDiffs →
 *   post-verify → update context + merkle → record session
 *
 * Any step failure restores the snapshot and returns the error.
 * The story cache is NEVER left in a partially-modified state.
 */
const workspaceContext              = require('../core/workspaceContext')
const sessionStore                  = require('../core/sessionStore')
const { verifyTree, updateLeaves }  = require('../integrity/merkleTree')
const { validateDiffs, applyDiffs } = require('../services/diffService')
const { buildRelationshipIndex, extractObjectCatalog } = require('../services/indexService')
const { assertStory }               = require('./verifier')

/**
 * Apply diffs atomically to the cached story for `storyId`.
 *
 * @param {string}   storyId
 * @param {object[]} diffs        - array of { momentGlobalIndex, changes[], changeLog }
 * @param {object}   [options]
 * @param {boolean}  [options.skipMerkleCheck=false]  - skip out-of-band edit detection
 * @returns {{ success: boolean, changeLog?: string, violations?: object[], error?: string }}
 */
async function applyAtomic(storyId, diffs, options = {}) {
  const ctx  = workspaceContext.getContext(storyId)
  if (!ctx) return fail('Story not loaded. Call load_story first.')

  const snap = workspaceContext.snapshot(storyId)

  try {
    // ── 1. Merkle integrity check ────────────────────────────────────────────
    if (!options.skipMerkleCheck && ctx.merkleTree) {
      const integrity = verifyTree(ctx.relationshipIndex.momentChain, ctx.storyJson, ctx.merkleTree)
      if (!integrity.valid) {
        return fail(
          `Story has been modified outside the pipeline (${integrity.tamperedMoments.length} moment(s) changed). ` +
          `Tampered global indexes: [${integrity.tamperedMoments.join(', ')}]. ` +
          'Reload the story with load_story to resync.'
        )
      }
    }

    // ── 2. Schema validation ─────────────────────────────────────────────────
    const validation = validateDiffs({
      allDiffs: diffs,
      storyJson: ctx.storyJson,
      momentChain: ctx.relationshipIndex.momentChain,
      objectCatalog: ctx.objectCatalog
    })
    if (!validation.valid) {
      return { success: false, violations: validation.violations }
    }

    // ── 3. Apply ─────────────────────────────────────────────────────────────
    const modifiedJson = applyDiffs({
      allDiffs: diffs,
      storyJson: ctx.storyJson,
      momentChain: ctx.relationshipIndex.momentChain
    })

    // ── 4. Post-apply verification ───────────────────────────────────────────
    const postCheck = assertStory(modifiedJson)
    if (!postCheck.valid) {
      workspaceContext.restore(storyId, snap)
      return {
        success: false,
        error: 'Post-apply verification failed — story rolled back.',
        violations: postCheck.violations
      }
    }

    // ── 5. Rebuild index + update context + update Merkle ────────────────────
    const newIndex   = buildRelationshipIndex(modifiedJson)
    const newCatalog = extractObjectCatalog(modifiedJson)
    const changedIndexes = diffs.map(d => d.momentGlobalIndex)
    const newMerkleTree  = ctx.merkleTree
      ? updateLeaves(ctx.merkleTree, changedIndexes, newIndex.momentChain, modifiedJson)
      : null

    workspaceContext.updateStory(storyId, modifiedJson, newIndex, newCatalog)

    // Patch merkleTree separately (updateStory rebuilds from chain, but we want incremental)
    const updated = workspaceContext.getContext(storyId)
    if (updated && newMerkleTree) updated.merkleTree = newMerkleTree

    // ── 6. Record to session ─────────────────────────────────────────────────
    const changeLog = diffs.map(d => `M${d.momentGlobalIndex}: ${d.changeLog}`).join('\n')
    sessionStore.record(storyId, changeLog, diffs.length)

    return { success: true, changeLog, diffsApplied: diffs.length }

  } catch (e) {
    workspaceContext.restore(storyId, snap)
    return fail(`Execution failed and was rolled back: ${e.message}`)
  }
}

function fail(error) {
  return { success: false, error }
}

module.exports = { applyAtomic }
