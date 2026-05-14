const { getMomentsIndex, ensureIndex } = require('../config/pinecone')

const BATCH_SIZE = 20

/**
 * Index all moments for a story in Pinecone.
 * Uses integrated inference — we upsert raw text and Pinecone embeds it.
 */
async function indexStoryMoments(storyId, momentChain) {
  const index = await ensureIndex()
  const ns    = index.namespace('__default__')

  await deleteStoryMoments(storyId)

  const records = momentChain.map(moment => ({
    _id: `${storyId}_${moment.globalIndex}`,
    chunk_text: [
      moment.momentName,
      moment.momentDescription,
      `objects: ${moment.objects.join(', ')}`
    ].filter(Boolean).join('. '),
    storyId,
    globalIndex:  moment.globalIndex,
    chapterIndex: moment.chapterIndex,
    localIndex:   moment.localIndex,
    momentId:     moment.momentId,
    momentName:   moment.momentName,
    objects:      moment.objects
  }))

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await ns.upsertRecords({ records: records.slice(i, i + BATCH_SIZE) })
  }

  return { indexed: records.length }
}

/**
 * Semantic search for moments matching a query.
 * Pinecone handles embedding the query text via integrated inference.
 */
async function searchMoments(storyId, query, topK = 3) {
  const index = await ensureIndex()

  const results = await index.namespace('__default__').searchRecords({
    query: {
      topK,
      inputs: { text: query },
      filter: { storyId: { $eq: storyId } }
    }
  })

  return (results.result?.hits || []).map(hit => ({
    score:        hit._score,
    globalIndex:  hit.fields?.globalIndex,
    chapterIndex: hit.fields?.chapterIndex,
    localIndex:   hit.fields?.localIndex,
    momentId:     hit.fields?.momentId,
    momentName:   hit.fields?.momentName,
    objects:      hit.fields?.objects || []
  }))
}

/**
 * Find all moments containing a specific object name.
 * Uses metadata filter — no vector search needed.
 */
async function searchByObjectName(storyId, objectName) {
  const index = await ensureIndex()

  const results = await index.namespace('__default__').searchRecords({
    query: {
      topK: 100,
      inputs: { text: objectName },
      filter: {
        $and: [
          { storyId:  { $eq: storyId } },
          { objects:  { $in: [objectName] } }
        ]
      }
    }
  })

  return (results.result?.hits || []).map(hit => ({
    globalIndex:  hit.fields?.globalIndex,
    chapterIndex: hit.fields?.chapterIndex,
    localIndex:   hit.fields?.localIndex,
    momentName:   hit.fields?.momentName
  }))
}

/**
 * Delete all moment vectors for a story (used before re-indexing).
 */
async function deleteStoryMoments(storyId) {
  const index = await ensureIndex()
  try {
    await index.deleteMany({ filter: { storyId: { $eq: storyId } } })
  } catch (err) {
    console.warn(`[vectorService] deleteMany failed (may be empty): ${err.message}`)
  }
}

module.exports = { indexStoryMoments, searchMoments, searchByObjectName, deleteStoryMoments }
