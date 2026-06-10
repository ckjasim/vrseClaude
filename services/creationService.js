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
 * Build the full generation context for a plan — the shared system prompt plus
 * one pre-built user message per moment. The orchestrator (Claude) spawns one
 * subagent per momentPrompt, feeding it `systemPrompt` + `userMessage`, and
 * collects the returned moment JSON. No LLM call happens inside the server.
 *
 * @returns {{ systemPrompt: string, cueSheet: string, momentPrompts: Array<{ generationId: string, name: string, userMessage: string }> }}
 */
function buildGenerationContext(plan, catalogText, sceneAwareness) {
  const cueSheet     = buildCueSheet(plan, sceneAwareness)
  const systemPrompt = buildMomentSystemPrompt(catalogText, sceneAwareness)
  const totalMoments = plan.chapters.reduce((sum, ch) => sum + ch.moments.length, 0)

  let globalIndex = 0
  const momentPrompts = plan.chapters.flatMap((ch, ci) =>
    ch.moments.map((m, mi) => ({
      generationId: `ch${ci}_m${mi}`,
      name:         m.name,
      userMessage:  buildMomentUserMessage({
        name:            m.name,
        chapterName:     ch.name,
        localIndex:      mi,
        totalInChapter:  ch.moments.length,
        globalIndex:     globalIndex++,
        totalMoments,
        userAction:      m.userAction,
        objectsInvolved: m.objectsInvolved || [],
        successHint:     m.successHint,
        spatialContext:  m.spatialContext,
        onRightMode:     m.onRightMode || 'InOrder'
      }, cueSheet)
    }))
  )

  return { systemPrompt, cueSheet, momentPrompts }
}

/**
 * Assemble the final story JSON from the plan + generated moments.
 * Enforces name and momentIndex from the plan — never trusts model output for these.
 * Applies the SFX placeholder safety net to every moment, since the moments now
 * arrive from subagents and are not normalized upstream.
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

        // Force all SFX audioUrl values to the placeholder — model output is not trusted here
        normalizeSFXPlaceholders(generated)

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

module.exports = { buildGenerationContext, assembleFinalJson, normalizeSFXPlaceholders }
