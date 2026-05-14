/**
 * Component 1 — Live Repo Context
 * Replaces the raw Map cache. Adds snapshot/restore for atomic rollback
 * and a getMerkleRoot hook for integrity checks.
 */
const { getMerkleRoot, buildMerkleTree } = require('../integrity/merkleTree')

const _store = new Map()

function getContext(storyId) {
  return _store.get(storyId) || null
}

function setContext(storyId, entry) {
  _store.set(storyId, entry)
}

/**
 * Replace the story JSON + rebuild derived index. Does NOT touch sessionStore.
 */
function updateStory(storyId, newStoryJson, newRelationshipIndex, newObjectCatalog) {
  const existing = _store.get(storyId)
  _store.set(storyId, {
    ...existing,
    storyJson: newStoryJson,
    relationshipIndex: newRelationshipIndex,
    objectCatalog: newObjectCatalog,
    merkleTree: buildMerkleTree(newRelationshipIndex.momentChain)
  })
}

/**
 * Deep-clone the current story JSON for rollback purposes.
 * Returns an opaque snapshot object — pass to restore().
 */
function snapshot(storyId) {
  const ctx = _store.get(storyId)
  if (!ctx) return null
  return {
    storyJson: JSON.parse(JSON.stringify(ctx.storyJson)),
    relationshipIndex: JSON.parse(JSON.stringify(ctx.relationshipIndex)),
    objectCatalog: [...ctx.objectCatalog],
    merkleTree: ctx.merkleTree ? { ...ctx.merkleTree } : null
  }
}

/**
 * Restore from a snapshot. Called by executor on failure.
 */
function restore(storyId, snap) {
  if (!snap) return
  const existing = _store.get(storyId)
  _store.set(storyId, { ...existing, ...snap })
}

function getMerkleRootForStory(storyId) {
  const ctx = _store.get(storyId)
  return ctx?.merkleTree?.root || null
}

/**
 * Store the raw scene awareness text + the list of catalog objects
 * confirmed to appear in that text. Called by load_scene_awareness.
 * Scene awareness is session-level — it is NOT rolled back on diff failure.
 */
function setSceneAwareness(storyId, rawText, confirmedObjects) {
  const existing = _store.get(storyId)
  if (!existing) return
  _store.set(storyId, {
    ...existing,
    sceneAwareness: rawText,
    confirmedSceneObjects: confirmedObjects
  })
}

function getSceneAwareness(storyId) {
  const ctx = _store.get(storyId)
  return {
    text:             ctx?.sceneAwareness             || '',
    confirmedObjects: ctx?.confirmedSceneObjects      || []
  }
}

/**
 * Store extracted SOP context. Safe to call before load_story —
 * creates a stub entry if the storyId is not yet in the store.
 * NOT rolled back on apply_diffs failure.
 */
function setSopContext(storyId, sopContext) {
  const existing = _store.get(storyId) || {}
  _store.set(storyId, { ...existing, sopContext })
}

function getSopContext(storyId) {
  return _store.get(storyId)?.sopContext || null
}

/**
 * Store the pending story plan (from create_story confirm:false).
 * Safe to call before load_story. NOT rolled back on apply_diffs failure.
 */
function setPendingPlan(storyId, plan) {
  const existing = _store.get(storyId) || {}
  _store.set(storyId, { ...existing, pendingPlan: plan })
}

function getPendingPlan(storyId) {
  return _store.get(storyId)?.pendingPlan || null
}

function has(storyId) {
  return _store.has(storyId)
}

function clear(storyId) {
  _store.delete(storyId)
}

module.exports = {
  getContext, setContext, updateStory,
  snapshot, restore,
  getMerkleRootForStory,
  setSceneAwareness, getSceneAwareness,
  setSopContext, getSopContext,
  setPendingPlan, getPendingPlan,
  has, clear
}
