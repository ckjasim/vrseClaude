const { chat } = require('./llmClient')

const MAX_RETRIES = 3

const PLACEHOLDER_URL = 'https://GENERATE_THIS.com'

// ─── SFX normalizer ───────────────────────────────────────────────────────────
// After LLM moment generation, unconditionally rewrite every SFXPlayer audioUrl
// to the placeholder. The LLM reliably hallucinates fake-looking URLs regardless
// of prompt instructions — this enforces correctness in code, not in the prompt.

function normalizeSFXPlaceholders(node) {
  if (Array.isArray(node)) {
    node.forEach(item => normalizeSFXPlaceholders(item))
  } else if (node && typeof node === 'object') {
    if (node.Name === 'SFXPlayer' && node.Data) {
      try {
        const data = JSON.parse(node.Data)
        if (data.audioUrl !== PLACEHOLDER_URL) {
          node.Data = JSON.stringify({ ...data, audioUrl: PLACEHOLDER_URL })
        }
      } catch { /* leave malformed Data untouched */ }
    }
    Object.values(node).forEach(val => normalizeSFXPlaceholders(val))
  }
}

// ─── Planning prompt ─────────────────────────────────────────────────────────

const PLAN_SYSTEM_PROMPT = `You are a VrseBuilder Story Architect. Given a training brief, available action/trigger types, and optional scene and SOP context, produce a structured VR story plan as JSON.

Return ONLY a valid JSON object with this exact schema:
{
  "storyName": "string",
  "chapters": [
    {
      "name": "string",
      "moments": [
        {
          "name": "string",
          "userAction": "string",
          "objectsInvolved": ["string"],
          "successHint": "string",
          "spatialContext": "string",
          "onRightMode": "InOrder|Random|Any"
        }
      ]
    }
  ]
}

Rules:
- Keep moment count proportional to the brief — do not over-generate
- userAction: precise VERB + OBJECT of what the player does (e.g. "Grab FireExtinguisher and aim at base of flame"), OR "narration" for intro/transition moments with no player interaction
- objectsInvolved: EXACT asset names from scene/SOP context if provided, or descriptive names if not; use [] for narration moments
- successHint: what success looks/sounds like (voice-over cue, icon, animation); use "auto-advance" for narration moments
- spatialContext: brief positioning note (e.g. "Object at waist height 1m ahead")
- onRightMode: InOrder when steps are sequential, Random when all required but any order, Any when alternative methods; use "InOrder" for narration moments (triggerActionSets will be empty)
- Return ONLY the JSON object — no markdown, no explanation`

// ─── Moment generation prompt ─────────────────────────────────────────────────

function buildMomentSystemPrompt(catalogText, sceneAwareness) {
  const sceneSection = sceneAwareness
    ? `\n\nSCENE CONSTRAINTS (AUTHORITATIVE — use only what is listed here):\n${sceneAwareness}`
    : ''

  return `You are a VrseBuilder VR Experience Design Expert. Generate a single complete VrseBuilder moment JSON object.

═══════════════════════════════════════════════════════════
SECTION 1 — EXACT OBJECT FORMATS (read this first)
═══════════════════════════════════════════════════════════

Every element in any "actions" array MUST use these exact PascalCase field names, flat — no nesting, no extra fields:
{
  "Query": "QueryName",
  "Name":  "ActionType",
  "Option": "ActionOption",
  "Data":  "{\"key\":\"value\",\"waitForCompletion\":true}"
}

The "trigger" inside each triggerActionSets element MUST use these exact PascalCase field names, flat:
{
  "Query":  "QueryName",
  "Name":   "TriggerType",
  "Option": "TriggerOption",
  "Data":   "{}"
}

CRITICAL: the only valid field names are "Query", "Name", "Option", "Data" (PascalCase).
NEVER use "query", "name", "option", "data" (lowercase), "actionName", "actionOption", "triggerName", "triggerOption", or a nested "action"/"trigger" object.

═══════════════════════════════════════════════════════════
SECTION 2 — TECHNICAL RULES
═══════════════════════════════════════════════════════════

MANDATORY FIXED QUERIES — these Query values are exact and non-negotiable:
- VoiceOver    → Query MUST be "VOPlayer"
- SFXPlayer    → Query MUST be "SFXPlayer"  (NEVER "SFXAmbient", "SFXPrismActivate", or any custom name)
- TimerAction  → Query MUST be "CountDownTimer"
- HapticsAction → Query MUST be "Haptics"
- Player        → Query MUST be "Player"
All other actions use the scene object name as Query.

SFX RULES:
- Every SFX action Data MUST include "audioClipName" — no exceptions
- Set useCloudAudio: true and audioUrl: "https://GENERATE_THIS.com"
- audioClipName should describe what the sound is (e.g. "CrystalPickup", "AmbientOffice")

DATA FIELD RULES:
- Data MUST always be a valid escaped JSON string — never a raw object
- waitForCompletion: true by default unless parallel execution is required

MetaLayerAction — two valid options, each with a different Data format:
- "SetActive" → simple visibility toggle; Data uses FLAT BOOLEANS:
  {"Outline":false,"Label":false,"Highlighter":false}
  (optionally add nested "GhostHand":{"ghostHandsState":"Both"})
- "Edit" → detailed customization; Data uses NESTED OBJECTS:
  {"Outline":{"setActive":true,"outlineColor":"#FF0000FF","outlineWidth":3.0}}

AnyTrigger: Option is always "" (empty string) — this is correct and expected.

OTHER RULES:
- onStart MUST have at least one VoiceOver that orients the player
- Use ONLY action/trigger types listed in the catalog below — never invent types
- ImageMediaAction: content = "" (path from resources), put description inside Data as a "description" key in the JSON string

WHEN TO USE onRight (IMPORTANT):
- Only populate triggerActionSets when the moment has a REAL player interaction (grab object, point at target, step into zone, press button, etc.)
- For narration/intro/transition moments where the player only watches or listens, leave triggerActionSets as an empty array []
- NEVER invent a fake trigger just to continue the flow — if the spec userAction is "narration", triggerActionSets MUST be []
- onWrong, onFirstWarning, onLastWarning are only needed when there is a real interaction to guide; leave them empty for narration moments

Moment Event Architecture:
- onAwake: environment setup, object pre-positioning, ambient setup
- onStart: context-setting VO, guidance, interaction enablement
- onRight: success actions fired after trigger(s) (mode: InOrder|Random|Any) — ONLY when real player interaction exists
- onWrong: educational redirection, hints — only for interactive moments
- onFirstWarning: gentle guidance, visual cues — only for interactive moments
- onLastWarning: explicit direction — only for interactive moments
- onEnd: achievement VO, transition cue to next moment

═══════════════════════════════════════════════════════════
SECTION 3 — ACTION & TRIGGER CATALOG
Use this catalog to look up valid "name" and "option" values.
Every action and trigger you write must come from this list.
═══════════════════════════════════════════════════════════

${catalogText}
${sceneSection}

═══════════════════════════════════════════════════════════
SECTION 4 — OUTPUT SCHEMA
═══════════════════════════════════════════════════════════

Return ONLY a valid JSON object for the generatedMoment — no markdown, no explanation:
{
  "name": "exact name from spec",
  "description": "one sentence",
  "momentIndex": 0,
  "onAwake":        { "actions": [] },
  "onStart":        { "actions": [] },
  "onRight":        { "mode": "InOrder", "triggerActionSets": [] },
  "onWrong":        [],
  "onFirstWarning": { "actions": [] },
  "onLastWarning":  { "actions": [] },
  "onEnd":          { "actions": [] },
  "sceneDescription": "one sentence describing environment + action-in-progress for image gen"
}

NOTE: For narration/intro moments (spec userAction = "narration"), triggerActionSets MUST be [] and onWrong/onFirstWarning/onLastWarning MUST be empty. Do not add any triggers.`
}

function buildMomentUserMessage(spec, cueSheet) {
  return `STORY CUE SHEET:
${cueSheet}

MOMENT SPEC:
Name: ${spec.name}
Chapter: ${spec.chapterName} (Moment ${spec.localIndex + 1} of ${spec.totalInChapter})
Global Position: Moment ${spec.globalIndex + 1} of ${spec.totalMoments}

User Action: ${spec.userAction}
Objects Involved: ${spec.objectsInvolved.join(', ') || 'none specified'}
Success Hint: ${spec.successHint}
Spatial Context: ${spec.spatialContext}
onRight Mode: ${spec.onRightMode}
${spec.userAction === 'narration' ? '\n⚠ NARRATION MOMENT — triggerActionSets MUST be [], onWrong/onFirstWarning/onLastWarning MUST be empty. No triggers.' : ''}
Generate the complete VrseBuilder moment JSON for this spec.`
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Plan step: one LLM call → structured story plan JSON.
 */
async function planStory({ brief, sopContext, sceneAwareness, catalogText }) {
  const contextParts = []

  if (sopContext) {
    contextParts.push(`SOP CONTEXT:
Objectives: ${sopContext.objectives.join('; ')}
Procedures: ${sopContext.procedures.join('; ')}
Equipment: ${sopContext.equipment.join(', ')}
Constraints: ${sopContext.constraints || 'none'}`)
  }

  if (sceneAwareness) {
    contextParts.push(`SCENE AWARENESS (use ONLY objects listed here):
${sceneAwareness}`)
  }

  contextParts.push(`AVAILABLE ACTION/TRIGGER TYPES (for reference when designing interactions):
${catalogText}`)

  const userMessage = [
    `TRAINING BRIEF:\n${brief || 'No brief provided — use SOP context above to determine the story.'}`,
    ...contextParts,
    'Generate the story plan JSON.'
  ].join('\n\n')

  const raw = await chat({
    systemPrompt: PLAN_SYSTEM_PROMPT,
    userMessage,
    jsonMode: true
  })

  let plan
  try {
    plan = JSON.parse(raw)
  } catch {
    throw new Error(`Planning call returned invalid JSON: ${raw.slice(0, 300)}`)
  }

  if (!plan.storyName || !Array.isArray(plan.chapters) || plan.chapters.length === 0) {
    throw new Error('Planning call returned incomplete plan — missing storyName or chapters')
  }

  return plan
}

/**
 * Generate a single moment. Returns parsed moment object or throws.
 */
async function generateMoment({ spec, catalogText, sceneAwareness, cueSheet }) {
  const systemPrompt = buildMomentSystemPrompt(catalogText, sceneAwareness)
  const userMessage  = buildMomentUserMessage(spec, cueSheet)

  const raw = await chat({ systemPrompt, userMessage, jsonMode: true, maxTokens: 8192 })

  let moment
  try {
    moment = JSON.parse(raw)
  } catch {
    throw new Error(`Moment generation returned invalid JSON for "${spec.name}"`)
  }

  if (!moment.onRight || !moment.onStart) {
    throw new Error(`Moment "${spec.name}" missing required fields (onRight / onStart)`)
  }

  // Force all SFX audioUrl values to the placeholder — LLM output is not trusted here
  normalizeSFXPlaceholders(moment)

  return moment
}

/**
 * Generate all moments in parallel with up to MAX_RETRIES retry rounds.
 * Returns { moments: Map<generationId, momentJson>, failed: spec[] }
 */
async function generateAllMoments({ plan, catalogText, sceneAwareness }) {
  const cueSheet = buildCueSheet(plan, sceneAwareness)

  // Flatten all moment specs from the plan
  let globalIndex = 0
  const totalMoments = plan.chapters.reduce((sum, ch) => sum + ch.moments.length, 0)

  const allSpecs = plan.chapters.flatMap((ch, ci) =>
    ch.moments.map((m, mi) => ({
      generationId:   `ch${ci}_m${mi}`,
      chapterIndex:   ci,
      chapterName:    ch.name,
      localIndex:     mi,
      totalInChapter: ch.moments.length,
      globalIndex:    globalIndex++,
      totalMoments,
      name:           m.name,
      userAction:     m.userAction,
      objectsInvolved: m.objectsInvolved || [],
      successHint:    m.successHint,
      spatialContext:  m.spatialContext,
      onRightMode:    m.onRightMode || 'InOrder'
    }))
  )

  const results = new Map()
  let pending = allSpecs

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (pending.length === 0) break

    const settled = await Promise.allSettled(
      pending.map(spec => generateMoment({ spec, catalogText, sceneAwareness, cueSheet }))
    )

    const stillFailed = []
    settled.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        results.set(pending[i].generationId, result.value)
      } else {
        if (attempt === MAX_RETRIES - 1) {
          console.error(`[creationService] Moment "${pending[i].name}" failed after ${MAX_RETRIES} attempts: ${result.reason?.message}`)
        }
        stillFailed.push(pending[i])
      }
    })

    pending = stillFailed
  }

  return { moments: results, failed: pending }
}

/**
 * Assemble the final story JSON from the plan + generated moments.
 * Enforces name and momentIndex from the plan — never trusts model output for these.
 */
function assembleFinalJson({ plan, moments }) {
  return {
    name: plan.storyName,
    chapters: plan.chapters.map((ch, ci) => ({
      name: ch.name,
      moments: ch.moments.map((m, mi) => {
        const generationId = `ch${ci}_m${mi}`
        const generated    = moments.get(generationId)
        if (!generated) return null

        return {
          ...generated,
          name:        m.name,
          momentIndex: mi
        }
      }).filter(Boolean)
    }))
  }
}

/**
 * Build the minimal cue sheet injected into every moment generation call.
 */
function buildCueSheet(plan, sceneAwareness) {
  const assetList = [
    ...new Set(
      plan.chapters.flatMap(ch =>
        ch.moments.flatMap(m => m.objectsInvolved || [])
      )
    )
  ]

  const lines = [
    `VR EXPERIENCE: ${plan.storyName}`,
    `CHAPTERS: ${plan.chapters.length}`,
    `TOTAL MOMENTS: ${plan.chapters.reduce((s, c) => s + c.moments.length, 0)}`,
    `AVAILABLE ASSETS: ${assetList.join(', ') || 'see scene description'}`
  ]

  if (sceneAwareness) {
    lines.push(
      '',
      'SCENE ASSET CONSTRAINTS (MANDATORY — scene description is loaded):',
      '- Every Query field MUST match a name in the Scene Description',
      '- SFX: use ONLY clip names from the SFX library in the Scene Description',
      '- Animations: use ONLY clip names listed for each object',
      '- Interactions: only apply trigger types that the object allows',
      '',
      `SCENE DESCRIPTION:\n${sceneAwareness}`
    )
  }

  return lines.join('\n')
}

module.exports = { planStory, generateMoment, generateAllMoments, assembleFinalJson }
