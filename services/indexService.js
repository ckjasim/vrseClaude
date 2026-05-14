/**
 * Builds the relationship index from a VrseBuilder story JSON.
 * Produces: objectMap, momentChain, storyContextHeader.
 * Ported directly from the architecture doc — proven logic, no changes.
 */
function buildRelationshipIndex(storyJson) {
  const objectMap = {}
  const momentChain = []
  let globalIndex = 0

  let runningSpawnedObjects = []
  let lastVO = ''

  for (const [chapterIndex, chapter] of storyJson.chapters.entries()) {
    for (const [localIndex, moment] of chapter.moments.entries()) {
      const objects = extractAllQueryNames(moment)

      const entryState = {
        spawnedObjects: [...runningSpawnedObjects],
        lastVO
      }

      runningSpawnedObjects = simulateSpawnState(moment, runningSpawnedObjects)
      lastVO = extractLastVO(moment)

      const exitState = {
        spawnedObjects: [...runningSpawnedObjects],
        lastVO
      }

      for (const objName of objects) {
        if (!objectMap[objName]) objectMap[objName] = []
        objectMap[objName].push({
          momentGlobalIndex: globalIndex,
          chapterIndex,
          localIndex,
          momentName: moment.name
        })
      }

      momentChain.push({
        globalIndex,
        chapterIndex,
        localIndex,
        momentId: moment.id,
        momentName: moment.name,
        momentDescription: moment.description || '',
        objects,
        entryState,
        exitState
      })

      globalIndex++
    }
  }

  const storyContextHeader = buildStoryContextHeader(storyJson, momentChain)

  return { objectMap, momentChain, storyContextHeader }
}

function extractAllQueryNames(moment) {
  const queries = new Set()
  const eventBlocks = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning']

  for (const block of eventBlocks) {
    for (const action of moment[block]?.actions || []) {
      if (action.Query) queries.add(action.Query)
    }
  }

  for (const set of moment.onRight?.triggerActionSets || []) {
    if (set.trigger?.Query) queries.add(set.trigger.Query)
    for (const action of set.actions || []) {
      if (action.Query) queries.add(action.Query)
    }
  }

  const onWrong = moment.onWrong
  if (Array.isArray(onWrong)) {
    for (const item of onWrong) {
      if (item.Query) queries.add(item.Query)
      for (const action of item.actions || []) {
        if (action.Query) queries.add(action.Query)
      }
    }
  }

  return [...queries]
}

function simulateSpawnState(moment, currentSpawned) {
  const spawned = new Set(currentSpawned)
  const allActions = collectAllActions(moment)

  for (const action of allActions) {
    if (action.Name === 'Objects') {
      if (action.Option === 'Spawn') spawned.add(action.Query)
      if (action.Option === 'Despawn') spawned.delete(action.Query)
    }
  }

  return [...spawned]
}

function extractLastVO(moment) {
  const allActions = collectAllActions(moment)
  const voActions = allActions.filter(a => a.Name === 'VoiceOver' && a.Option === 'Play')
  if (voActions.length === 0) return ''
  const lastAction = voActions[voActions.length - 1]
  try {
    return JSON.parse(lastAction.Data).text || ''
  } catch {
    return ''
  }
}

function collectAllActions(moment) {
  const actions = []
  const blocks = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning']
  for (const block of blocks) {
    actions.push(...(moment[block]?.actions || []))
  }
  for (const set of moment.onRight?.triggerActionSets || []) {
    actions.push(...(set.actions || []))
  }
  return actions
}

function buildStoryContextHeader(storyJson, momentChain) {
  const allObjects = [...new Set(momentChain.flatMap(m => m.objects))]
  const chapterNames = storyJson.chapters.map((c, i) => `Chapter ${i}: ${c.name}`).join(', ')
  const momentNames = momentChain.map(m => `M${m.globalIndex}(${m.momentName})`).join(', ')

  return [
    `STORY: ${storyJson.name}`,
    `CHAPTERS: ${chapterNames}`,
    `MOMENTS: ${momentNames}`,
    `SCENE_OBJECTS: ${allObjects.join(', ')}`,
    `FORMAT_VERSION: ${storyJson.formatVersion}`
  ].join('\n')
}

function extractObjectCatalog(storyJson) {
  const objects = new Set()
  for (const chapter of storyJson.chapters) {
    for (const moment of chapter.moments) {
      const allActions = collectAllActions(moment)
      for (const action of allActions) {
        if (action.Query) objects.add(action.Query)
      }
      for (const set of moment.onRight?.triggerActionSets || []) {
        if (set.trigger?.Query) objects.add(set.trigger.Query)
      }
    }
  }
  return [...objects]
}

module.exports = { buildRelationshipIndex, extractObjectCatalog, collectAllActions }
