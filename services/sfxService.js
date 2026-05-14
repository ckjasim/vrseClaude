const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')

const PLACEHOLDER_URL = 'https://GENERATE_THIS.com'

// ─── Recursive walker ─────────────────────────────────────────────────────────
// Walks the full story JSON tree in one pass and collects every SFXPlayer action
// object as a live reference. No manual path enumeration — works regardless of
// nesting depth or future schema additions.

function collectSFXRefs(node, refs = []) {
  if (Array.isArray(node)) {
    node.forEach(item => collectSFXRefs(item, refs))
  } else if (node && typeof node === 'object') {
    if (node.Name === 'SFXPlayer' && node.Data) refs.push(node)
    Object.values(node).forEach(val => collectSFXRefs(val, refs))
  }
  return refs
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
// Finds all SFX placeholder refs in the story, fires all ElevenLabs calls in
// parallel, uploads each result to S3, and patches the action Data in place.
// Returns { totalUpdates, totalErrors, results[] }.

async function generateSFXForStory(storyJson, storyId) {
  const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })

  const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

  // Collect every SFXPlayer action from the whole story tree
  const allRefs = collectSFXRefs(storyJson)

  // Filter to only those still holding the placeholder URL
  const pendingRefs = allRefs.filter(action => {
    try {
      return JSON.parse(action.Data).audioUrl === PLACEHOLDER_URL
    } catch {
      return false
    }
  })

  if (pendingRefs.length === 0) {
    console.log('[sfxService] No SFX placeholders found — nothing to generate.')
    return { totalUpdates: 0, totalErrors: 0, results: [] }
  }

  console.log(`[sfxService] Generating ${pendingRefs.length} SFX in parallel...`)

  // One parallel blast — all ElevenLabs calls go out simultaneously
  const settled = await Promise.allSettled(
    pendingRefs.map(async (action) => {
      const currentData = JSON.parse(action.Data)
      const { audioClipName } = currentData

      // Generate audio from clip name description.
      // HttpResponsePromise.then() unwraps to .data automatically — await gives the stream directly.
      const stream = await elevenlabs.textToSoundEffects.convert({
        text: audioClipName,
      })

      // Consume ReadableStream → Buffer
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)

      // Upload to S3 under stories/{storyId}/sfx/{uuid}.mp3
      const audioId  = uuidv4()
      const s3Key    = `stories/${storyId}/sfx/${audioId}.mp3`

      await s3.send(new PutObjectCommand({
        Bucket:      process.env.AWS_BUCKET_NAME,
        Key:         s3Key,
        Body:        audioBuffer,
        ContentType: 'audio/mpeg',
      }))

      const audioUrl = `${process.env.PUBLIC_CLOUDFRONT_URL}/${s3Key}`

      // Patch the live action object in place — no return value needed
      action.Data = JSON.stringify({ ...currentData, audioUrl })

      console.log(`[sfxService] ✓ "${audioClipName}" → ${audioUrl}`)

      return { success: true, audioClipName, audioUrl }
    })
  )

  // Normalise results
  const results = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value

    let audioClipName = '(unknown)'
    try {
      audioClipName = JSON.parse(pendingRefs[i].Data).audioClipName
    } catch { /* original Data already patched or unparseable */ }

    console.error(`[sfxService] ✗ "${audioClipName}": ${r.reason?.message}`)
    return { success: false, audioClipName, error: r.reason?.message }
  })

  const totalUpdates = results.filter(r => r.success).length
  const totalErrors  = results.filter(r => !r.success).length

  console.log(`[sfxService] Complete — ${totalUpdates} generated, ${totalErrors} errors`)

  return { totalUpdates, totalErrors, results }
}

module.exports = { collectSFXRefs, generateSFXForStory }
