const { Pinecone } = require('@pinecone-database/pinecone')

let _client = null

function getPineconeClient() {
  if (!_client) {
    _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  }
  return _client
}

function getMomentsIndex() {
  return getPineconeClient().index(process.env.PINECONE_INDEX_NAME || 'vrse-moments')
}

async function ensureIndex() {
  const pc = getPineconeClient()
  const indexName = process.env.PINECONE_INDEX_NAME || 'vrse-moments'

  const { indexes } = await pc.listIndexes()
  const exists = indexes?.some(i => i.name === indexName)

  if (!exists) {
    await pc.createIndexForModel({
      name: indexName,
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: { text: 'chunk_text' }
      },
      waitUntilReady: true
    })
    console.log(`[Pinecone] Created index "${indexName}" with integrated inference`)
  }

  return getMomentsIndex()
}

module.exports = { getPineconeClient, getMomentsIndex, ensureIndex }
