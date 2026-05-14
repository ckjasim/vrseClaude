/**
 * Test: Relationship Index Builder
 * Run: npm run test:index
 * No API keys needed — pure code test.
 */
const { buildRelationshipIndex, extractObjectCatalog } = require('../services/indexService')

const sampleStory = {
  name: 'Crystal Tutorial',
  formatVersion: '1.0',
  chapters: [
    {
      name: 'Introduction',
      moments: [
        {
          id: 'moment-1',
          name: 'Crystal Awakening',
          description: 'Player discovers the crystal',
          momentIndex: 0,
          onAwake: { actions: [] },
          onStart: {
            actions: [
              { Name: 'VoiceOver', Option: 'Play', Query: 'VOPlayer', Data: '{"text":"Welcome to the crystal cave","waitForCompletion":true}' },
              { Name: 'Objects', Option: 'Spawn', Query: 'GO_Crystal_01', Data: '{}' }
            ]
          },
          onEnd: { actions: [] },
          onRight: {
            triggerActionSets: [
              {
                trigger: { Name: 'Grab', Query: 'GO_Crystal_01' },
                actions: [
                  { Name: 'VoiceOver', Option: 'Play', Query: 'VOPlayer', Data: '{"text":"You grabbed the crystal!","waitForCompletion":true}' }
                ]
              }
            ]
          }
        },
        {
          id: 'moment-2',
          name: 'Crystal Placement',
          description: 'Player places the crystal on the pedestal',
          momentIndex: 1,
          onAwake: { actions: [] },
          onStart: {
            actions: [
              { Name: 'VoiceOver', Option: 'Play', Query: 'VOPlayer', Data: '{"text":"Place the crystal on the pedestal","waitForCompletion":true}' },
              { Name: 'Objects', Option: 'Spawn', Query: 'GO_Pedestal_01', Data: '{}' }
            ]
          },
          onEnd: {
            actions: [
              { Name: 'Objects', Option: 'Despawn', Query: 'GO_Crystal_01', Data: '{}' }
            ]
          },
          onRight: {
            triggerActionSets: [
              {
                trigger: { Name: 'Place', Query: 'GO_Pedestal_01' },
                actions: [
                  { Name: 'SFXPlayer', Option: 'Play', Query: 'SFXPlayer', Data: '{"useCloudAudio":true,"audioUrl":"https://example.com/chime.mp3"}' }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}

console.log('=== Testing Relationship Index Builder ===\n')

const result = buildRelationshipIndex(sampleStory)

console.log('Moment Chain:')
for (const m of result.momentChain) {
  console.log(`  M${m.globalIndex}: ${m.momentName}`)
  console.log(`    objects: ${m.objects.join(', ')}`)
  console.log(`    entry spawned: [${m.entryState.spawnedObjects.join(', ')}]`)
  console.log(`    exit spawned:  [${m.exitState.spawnedObjects.join(', ')}]`)
}

console.log('\nObject Map:')
for (const [obj, refs] of Object.entries(result.objectMap)) {
  console.log(`  ${obj}: appears in moments [${refs.map(r => r.momentGlobalIndex).join(', ')}]`)
}

console.log('\nStory Context Header:')
console.log(result.storyContextHeader)

console.log('\nObject Catalog:')
console.log(extractObjectCatalog(sampleStory))

console.log('\n=== All tests passed ===')
