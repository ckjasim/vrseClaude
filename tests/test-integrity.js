/**
 * Test suite: Merkle tree + post-apply verifier.
 * Run with: node tests/test-integrity.js
 */
require('dotenv').config()

const { buildMerkleTree, verifyTree, updateLeaves } = require('../integrity/merkleTree')
const { assertStory } = require('../pipeline/verifier')
const { buildRelationshipIndex } = require('../services/indexService')

let pass = true
function check(label, condition, info) {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    console.error(`  FAIL  ${label}${info ? ' | ' + info : ''}`)
    pass = false
  }
}

// ── Minimal story fixture ────────────────────────────────────────────────────
const story = {
  name: 'Test Story',
  formatVersion: 1,
  chapters: [
    {
      name: 'Chapter A',
      moments: [
        {
          momentIndex: 0,
          id: 'aaa',
          name: 'Moment Alpha',
          description: 'First moment',
          onAwake: { actions: [{ Name: 'VoiceOver', Query: 'VOPlayer', Option: 'Play', Data: '{"text":"Hello","waitForCompletion":true}', Type: 0 }] },
          onStart: { actions: [] },
          onRight: { mode: 'InOrder', triggerActionSets: [{ trigger: { Name: 'GrabbableTrigger', Query: 'ObjA', Option: 'Grab', Data: '{"handOption":"Right"}', Type: 0 }, actions: [] }] },
          onWrong: [],
          onFirstWarning: { actions: [] },
          onLastWarning: { actions: [] },
          onEnd: { actions: [] }
        },
        {
          momentIndex: 1,
          id: 'bbb',
          name: 'Moment Beta',
          description: 'Second moment',
          onAwake: { actions: [] },
          onStart: { actions: [{ Name: 'VoiceOver', Query: 'VOPlayer', Option: 'Play', Data: '{"text":"World","waitForCompletion":false}', Type: 0 }] },
          onRight: { mode: 'InOrder', triggerActionSets: [{ trigger: { Name: 'GrabbableTrigger', Query: 'ObjB', Option: 'Grab', Data: '{"handOption":"Left"}', Type: 0 }, actions: [] }] },
          onWrong: [],
          onFirstWarning: { actions: [] },
          onLastWarning: { actions: [] },
          onEnd: { actions: [] }
        }
      ]
    }
  ]
}

// ── 1. Merkle Tree ───────────────────────────────────────────────────────────
console.log('\n=== MERKLE TREE ===')

const { momentChain } = buildRelationshipIndex(story)
const tree = buildMerkleTree(momentChain, story)

check('Tree has 2 leaves',         tree.leaves.length === 2)
check('Tree root is non-empty',    tree.root.length === 64)
check('Leaf 0 hash is 64 chars',   tree.leaves[0].hash.length === 64)
check('Leaf 1 hash differs from leaf 0', tree.leaves[0].hash !== tree.leaves[1].hash)

const integrityOk = verifyTree(momentChain, story, tree)
check('Verify matches original tree', integrityOk.valid)
check('No tampered moments',          integrityOk.tamperedMoments.length === 0)

const tamperedStory = JSON.parse(JSON.stringify(story))
tamperedStory.chapters[0].moments[1].name = 'TAMPERED'
const integrityBad = verifyTree(momentChain, tamperedStory, tree)
check('Tamper detected',               !integrityBad.valid)
check('Tampered moment index is 1',    integrityBad.tamperedMoments.includes(1))

const updatedTree = updateLeaves(tree, [0], momentChain, story)
check('Updated tree root unchanged when leaf 0 content unchanged', updatedTree.root === tree.root)

// ── 2. Verifier ──────────────────────────────────────────────────────────────
console.log('\n=== VERIFIER ===')

const validResult = assertStory(story)
check('Valid story passes all assertions', validResult.valid)

const badStory = JSON.parse(JSON.stringify(story))
badStory.chapters[0].moments[0].momentIndex = 99
const badIndexResult = assertStory(badStory)
check('Bad momentIndex detected', !badIndexResult.valid)
check('Violation type is MOMENT_INDEX_MISMATCH', badIndexResult.violations.some(v => v.type === 'MOMENT_INDEX_MISMATCH'))

const brokenDataStory = JSON.parse(JSON.stringify(story))
brokenDataStory.chapters[0].moments[0].onAwake.actions[0].Data = '{"broken": 1.0","field": true}'
const brokenDataResult = assertStory(brokenDataStory)
check('Broken Data JSON detected', !brokenDataResult.valid)
check('Violation type is INVALID_DATA_JSON', brokenDataResult.violations.some(v => v.type === 'INVALID_DATA_JSON'))

console.log(`\n${pass ? 'All integrity checks passed!' : 'Some checks FAILED - see above.'}`)
process.exit(pass ? 0 : 1)
