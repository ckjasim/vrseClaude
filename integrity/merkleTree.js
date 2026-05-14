/**
 * Merkle Tree — structural integrity per moment.
 *
 * Each moment gets a SHA-256 hash of its canonical JSON.
 * The story root hash is derived from all moment hashes in order.
 * This detects out-of-band edits (e.g. manual file changes) before
 * the pipeline attempts to apply diffs on a corrupted base.
 *
 * Uses Node built-in `crypto` — no new npm dependency.
 */
const crypto = require('crypto')

function hashMoment(momentJson) {
  const canonical = JSON.stringify(momentJson)
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

function hashRoot(leafHashes) {
  const combined = leafHashes.join('')
  return crypto.createHash('sha256').update(combined).digest('hex')
}

/**
 * Build a Merkle tree from a momentChain (array of chain entries)
 * and the full storyJson.
 *
 * @param {object[]} momentChain  - from buildRelationshipIndex
 * @param {object}   storyJson    - the raw story
 * @returns {{ leaves: object[], root: string }}
 */
function buildMerkleTree(momentChain, storyJson) {
  if (!momentChain || !storyJson) return { leaves: [], root: '' }

  const leaves = momentChain.map(entry => {
    const momentJson = storyJson.chapters[entry.chapterIndex]?.moments[entry.localIndex]
    const hash = momentJson ? hashMoment(momentJson) : ''
    return { globalIndex: entry.globalIndex, momentName: entry.momentName, hash }
  })

  const root = hashRoot(leaves.map(l => l.hash))
  return { leaves, root }
}

/**
 * Verify the current storyJson against a stored tree.
 * Returns which moments have changed (tampered or legitimately modified).
 *
 * @param {object[]} momentChain
 * @param {object}   storyJson
 * @param {{ leaves: object[], root: string }} storedTree
 * @returns {{ valid: boolean, tamperedMoments: number[], newRoot: string }}
 */
function verifyTree(momentChain, storyJson, storedTree) {
  if (!storedTree || storedTree.leaves.length === 0) {
    return { valid: true, tamperedMoments: [], newRoot: '' }
  }

  const currentTree = buildMerkleTree(momentChain, storyJson)
  const tamperedMoments = []

  for (let i = 0; i < storedTree.leaves.length; i++) {
    const stored  = storedTree.leaves[i]
    const current = currentTree.leaves[i]
    if (!current || current.hash !== stored.hash) {
      tamperedMoments.push(stored.globalIndex)
    }
  }

  return {
    valid: tamperedMoments.length === 0,
    tamperedMoments,
    newRoot: currentTree.root
  }
}

/**
 * Update only the leaves that changed (after a successful apply_diffs).
 * More efficient than rebuilding the whole tree.
 *
 * @param {{ leaves: object[], root: string }} existingTree
 * @param {number[]}  changedGlobalIndexes
 * @param {object[]}  momentChain
 * @param {object}    storyJson
 * @returns {{ leaves: object[], root: string }}
 */
function updateLeaves(existingTree, changedGlobalIndexes, momentChain, storyJson) {
  const changed = new Set(changedGlobalIndexes)
  const newLeaves = existingTree.leaves.map(leaf => {
    if (!changed.has(leaf.globalIndex)) return leaf
    const entry = momentChain[leaf.globalIndex]
    if (!entry) return leaf
    const momentJson = storyJson.chapters[entry.chapterIndex]?.moments[entry.localIndex]
    return { ...leaf, hash: momentJson ? hashMoment(momentJson) : '' }
  })
  const root = hashRoot(newLeaves.map(l => l.hash))
  return { leaves: newLeaves, root }
}

module.exports = { buildMerkleTree, verifyTree, updateLeaves, hashMoment }
