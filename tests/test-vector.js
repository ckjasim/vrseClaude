/**
 * Test: Pinecone Vector Search
 * Run: npm run test:vector
 * Requires: PINECONE_API_KEY in .env
 */
require('dotenv').config()
const { indexStoryMoments, searchMoments, searchByObjectName } = require('../services/vectorService')

const STORY_ID = 'test-story-001'

const mockMomentChain = [
  {
    globalIndex: 0,
    chapterIndex: 0,
    localIndex: 0,
    momentId: 'moment-1',
    momentName: 'Crystal Awakening Tutorial',
    momentDescription: 'Player discovers and picks up the crystal',
    objects: ['VOPlayer', 'GO_Crystal_01']
  },
  {
    globalIndex: 1,
    chapterIndex: 0,
    localIndex: 1,
    momentId: 'moment-2',
    momentName: 'Crystal Placement on Pedestal',
    momentDescription: 'Player places the crystal on the glowing pedestal',
    objects: ['VOPlayer', 'GO_Crystal_01', 'GO_Pedestal_01', 'SFXPlayer']
  },
  {
    globalIndex: 2,
    chapterIndex: 1,
    localIndex: 0,
    momentId: 'moment-3',
    momentName: 'Boss Fight Begins',
    momentDescription: 'The boss emerges from the shadows',
    objects: ['VOPlayer', 'GO_Boss_01', 'SFXPlayer']
  }
]

async function run() {
  console.log('=== Testing Pinecone Vector Service ===\n')

  console.log('1. Indexing moments...')
  const indexed = await indexStoryMoments(STORY_ID, mockMomentChain)
  console.log(`   Indexed ${indexed.indexed} moments\n`)

  // Wait for indexing to propagate
  console.log('   Waiting 5s for index propagation...')
  await new Promise(r => setTimeout(r, 5000))

  console.log('2. Searching: "change the crystal voiceover"')
  const results = await searchMoments(STORY_ID, 'change the crystal voiceover', 3)
  for (const r of results) {
    console.log(`   Score ${r.score?.toFixed(3)} — M${r.globalIndex}: ${r.momentName}`)
  }

  console.log('\n3. Searching by object: "GO_Crystal_01"')
  const objResults = await searchByObjectName(STORY_ID, 'GO_Crystal_01')
  for (const r of objResults) {
    console.log(`   M${r.globalIndex}: ${r.momentName}`)
  }

  console.log('\n=== Vector test complete ===')
}

run().catch(err => {
  console.error('Test failed:', err.message)
  process.exit(1)
})
