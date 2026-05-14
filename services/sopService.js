const { chat } = require('./llmClient')

const EXTRACT_SYSTEM_PROMPT = `You are a VR training content analyst.
Given a Standard Operating Procedure (SOP) or training document, extract the key information needed to design a VR training experience.

Return ONLY a valid JSON object with this exact schema:
{
  "objectives": ["string"],
  "procedures": ["string"],
  "equipment": ["string"],
  "constraints": "string"
}

Field definitions:
- objectives: Learning goals the trainee must achieve (e.g. "Identify fire hazards", "Operate extinguisher correctly")
- procedures: Ordered step-by-step actions from the SOP (e.g. "Pull safety pin", "Aim at base of fire")
- equipment: Physical items, tools, assets, or objects referenced (exact names as written in the doc)
- constraints: Any hard rules, safety requirements, sequence dependencies, or prohibitions written as a single paragraph. Empty string if none.

Rules:
- Preserve exact asset/object names from the document — do not paraphrase
- Keep procedures in the original order
- If the document has no explicit constraints, return an empty string for that field
- Return ONLY the JSON object — no markdown, no explanation`

/**
 * Extract structured SOP context from raw document text.
 * Makes one LLM call. Returns structured object stored in workspaceContext.
 *
 * @param {string} rawText — full text content of the SOP file
 * @returns {Promise<{ objectives: string[], procedures: string[], equipment: string[], constraints: string }>}
 */
async function extractSopContext(rawText) {
  const truncated = rawText.slice(0, 40000)

  const raw = await chat({
    systemPrompt: EXTRACT_SYSTEM_PROMPT,
    userMessage:  `Extract the VR training context from this document:\n\n${truncated}`,
    jsonMode:     true
  })

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`SOP extraction returned invalid JSON: ${raw.slice(0, 200)}`)
  }

  return {
    objectives:  Array.isArray(parsed.objectives)  ? parsed.objectives  : [],
    procedures:  Array.isArray(parsed.procedures)  ? parsed.procedures  : [],
    equipment:   Array.isArray(parsed.equipment)   ? parsed.equipment   : [],
    constraints: typeof parsed.constraints === 'string' ? parsed.constraints : ''
  }
}

module.exports = { extractSopContext }
