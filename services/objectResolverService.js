/**
 * objectResolverService.js
 *
 * Resolves SOP physical-object nouns to confirmed Unity scene objects.
 * All LLM calls live here; Unity calls (execute_code, scene_hierarchy) are
 * made by the agent and fed back to this service as plain JSON data.
 *
 * Two-step flow expected by the tool:
 *   1. prepare(sopContext, sceneCatalog)
 *      → extracts nouns (LLM), expands keywords + synonyms (LLM),
 *        returns a keyword map + the C# batch-search code to run.
 *   2. resolve(prepareState, batchResults, subtreeResultsMap, sceneCatalog)
 *      → maps hits → nouns, walks subtrees via LLM child mapping,
 *        attempts LLM catalog match for unresolved items,
 *        returns a structured resolution report.
 */

const { chat } = require('./llmClient')

// ─────────────────────────────────────────────────────────────────────────────
// LLM system prompts
// ─────────────────────────────────────────────────────────────────────────────

const NOUN_EXTRACTION_SYSTEM = `You are a VR training content analyst specialising in industrial scenes.

Given SOP equipment list and procedure steps, extract every physical object the trainee must interact with, observe, or that is highlighted/animated.

Group objects hierarchically:
- "parent": a major assembly or standalone object (use exact SOP wording)
- "children": sub-components of that parent mentioned in the SOP (buttons, handles, parts)
- "orphans": standalone objects with no clear parent

Rules:
- Use the exact wording from the SOP for each term (do not normalise or paraphrase)
- A child belongs to a parent when the SOP describes it as part of, on, or attached to the parent
- Do not include UI elements (on-screen buttons, checklists, HUD panels)
- Do not include abstract concepts, only physical objects
- Return ONLY valid JSON:
  { "groups": [{ "parent": string, "children": string[] }], "orphans": string[] }`

const SYNONYM_GENERATION_SYSTEM = `You are a Unity scene naming expert with knowledge of industrial VR simulations.

Given a physical object term from an SOP, generate alternative search keywords a Unity developer might use to name that asset.

Rules:
- Generate 4-8 alternatives covering: abbreviations, PascalCase variants, underscore_joined variants, partial names, related technical terms
- Think like a Unity developer: short names, PascalCase, underscores, no spaces
- Include each individual sub-word of multi-word terms
- Return ONLY a JSON array of strings, nothing else`

const CHILD_MAPPING_SYSTEM = `You are a VR scene structure analyst matching SOP child terms to Unity child object names.

Given a list of SOP child terms (e.g. "down button", "grab handle") and a list of actual Unity child names from a subtree, map each SOP term to the best Unity name.

Rules:
- Only map to names that exist in the provided Unity list
- A SOP term maps to null if nothing in the list represents it
- Consider industrial context (steel manufacturing / continuous casting)
- Return ONLY valid JSON: { "sopTerm": "unityName" | null, ... }`

const CATALOG_MATCH_SYSTEM = `You are a Unity scene object matcher for industrial VR simulations.

Given a physical SOP term and a list of Unity scene object names, identify which object best represents the SOP term.

Rules:
- Consider industrial context (steel manufacturing / continuous casting)
- Unity names use PascalCase and underscores; SOP uses natural language
- Return the single best match, multiple candidates if ambiguous, or null
- Return ONLY valid JSON:
  { "match": "UnityName" | null, "candidates": string[] | null }`

// ─────────────────────────────────────────────────────────────────────────────
// C# code builders (pure functions — no LLM, no I/O)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build C# code for a batch keyword search across the entire scene.
 * Each matching object is returned once (first keyword that hits it).
 *
 * @param {string[]} keywords
 * @returns {string} C# method body for unity_execute_code
 */
function buildBatchSearchCode(keywords) {
  // Emit a valid C# string array literal — JSON.stringify produces JS syntax
  const csArray = 'new string[] { ' + keywords.map(k => JSON.stringify(k)).join(', ') + ' }'

  return `
var keywords = ${csArray};
var seen = new System.Collections.Generic.HashSet<int>();
var results = new System.Collections.Generic.List<object>();
foreach (var go in Resources.FindObjectsOfTypeAll<UnityEngine.GameObject>()) {
  if (seen.Contains(go.GetInstanceID())) continue;
  var nameLower = go.name.ToLower();
  foreach (var kw in keywords) {
    if (nameLower.Contains(kw.ToLower())) {
      seen.Add(go.GetInstanceID());
      var path = go.name;
      var p = go.transform.parent;
      while (p != null) { path = p.name + "/" + path; p = p.parent; }
      results.Add(new {
        name       = go.name,
        path       = path,
        active     = go.activeSelf,
        childCount = go.transform.childCount,
        matchedKw  = kw,
        components = System.Array.ConvertAll(
          go.GetComponents<UnityEngine.Component>(),
          c => c != null ? c.GetType().Name : "null"
        )
      });
      break;
    }
  }
}
return results;
`.trim()
}

/**
 * Build C# code to walk the full subtree of the first GameObject whose
 * name exactly equals `objectName`.
 *
 * @param {string} objectName
 * @returns {string} C# method body for unity_execute_code
 */
function buildSubtreeWalkCode(objectName) {
  return `
var results = new System.Collections.Generic.List<object>();
UnityEngine.GameObject root = null;
foreach (var go in Resources.FindObjectsOfTypeAll<UnityEngine.GameObject>()) {
  if (go.name == ${JSON.stringify(objectName)}) { root = go; break; }
}
if (root != null) {
  var stack = new System.Collections.Generic.Stack<UnityEngine.Transform>();
  stack.Push(root.transform);
  while (stack.Count > 0) {
    var t = stack.Pop();
    var path = t.name;
    var p = t.parent;
    while (p != null) { path = p.name + "/" + path; p = p.parent; }
    results.Add(new {
      name       = t.name,
      path       = path,
      active     = t.gameObject.activeSelf,
      childCount = t.childCount,
      components = System.Array.ConvertAll(
        t.GetComponents<UnityEngine.Component>(),
        c => c != null ? c.GetType().Name : "null"
      )
    });
    foreach (UnityEngine.Transform child in t) stack.Push(child);
  }
}
return results;
`.trim()
}

/**
 * Pure keyword expansion: split a natural-language noun into likely Unity
 * search keywords using sub-words, PascalCase and underscore variants.
 *
 * @param {string} noun e.g. "shroud manipulator arm"
 * @returns {string[]}   e.g. ["shroud","manipulator","arm","shroud_manipulator","Shroud"]
 */
function buildKeywordSearch(noun) {
  const words = noun.toLowerCase().split(/[\s_\-]+/).filter(Boolean)
  const kws = new Set(words)
  for (let i = 0; i < words.length - 1; i++) {
    kws.add(words[i] + '_' + words[i + 1])
  }
  if (words.length === 2) kws.add(words.join('_'))
  for (const w of words) kws.add(w.charAt(0).toUpperCase() + w.slice(1))
  return [...kws]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safe JSON parse
// ─────────────────────────────────────────────────────────────────────────────

function parseLlmJson(raw) {
  try { return JSON.parse(raw) } catch {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim()
    return JSON.parse(cleaned)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — prepare
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract SOP nouns and expand keywords + synonyms for a batch Unity search.
 *
 * @param {{ equipment: string[], procedures: string[] }} sopContext
 * @returns {Promise<{
 *   nounGroups: { groups: object[], orphans: string[] },
 *   keywordMap: Record<string, string[]>,   // keyword → nouns that produced it
 *   allKeywords: string[],
 *   batchSearchCode: string
 * }>}
 */
async function extractSopNouns(sopContext) {
  const equipmentList  = (sopContext.equipment  || []).join('\n')
  const procedureList  = (sopContext.procedures || []).join('\n')

  const raw = await chat({
    systemPrompt: NOUN_EXTRACTION_SYSTEM,
    userMessage:  `Equipment list:\n${equipmentList}\n\nProcedure steps:\n${procedureList}`,
    jsonMode:     true
  })

  const parsed = parseLlmJson(raw)
  const nounGroups = {
    groups:  Array.isArray(parsed.groups)  ? parsed.groups  : [],
    orphans: Array.isArray(parsed.orphans) ? parsed.orphans : []
  }

  // Collect all top-level nouns (parents + orphans)
  const topLevelNouns = [
    ...nounGroups.groups.map(g => g.parent),
    ...nounGroups.orphans
  ]

  // Generate synonyms for every noun in parallel
  const synonymBatches = await Promise.all(topLevelNouns.map(generateSynonyms))

  // Build keyword → [nouns] map
  const keywordMap = {}
  const allKeywordsSet = new Set()

  for (let i = 0; i < topLevelNouns.length; i++) {
    const noun = topLevelNouns[i]
    const kws = [
      ...buildKeywordSearch(noun),
      ...synonymBatches[i]
    ]
    for (const kw of kws) {
      allKeywordsSet.add(kw)
      if (!keywordMap[kw]) keywordMap[kw] = []
      if (!keywordMap[kw].includes(noun)) keywordMap[kw].push(noun)
    }
  }

  const allKeywords    = [...allKeywordsSet]
  const batchSearchCode = buildBatchSearchCode(allKeywords)

  return { nounGroups, keywordMap, allKeywords, batchSearchCode }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — resolve
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map Unity search results back to SOP nouns and produce a resolution report.
 * Attempt 3 (LLM reads scene catalog) is done inline for unresolved nouns.
 *
 * @param {object} opts
 * @param {{ groups: object[], orphans: string[] }} opts.nounGroups         — from extractSopNouns
 * @param {Record<string, string[]>}                opts.keywordMap          — from extractSopNouns
 * @param {object[]}                                opts.batchResults        — parsed unity_execute_code results
 * @param {Record<string, object[]>}               [opts.subtreeResultsMap] — objectName → subtree hits
 * @param {string[]}                               [opts.sceneCatalog]       — root names for attempt 3
 * @returns {Promise<{
 *   RESOLVED:       object[],
 *   PARTIAL_MATCH:  object[],
 *   AMBIGUOUS:      object[],
 *   NOT_IN_SCENE:   object[],
 *   pendingSubtrees: string[]   // objectNames the agent should walk (returned before subtrees provided)
 * }>}
 */
async function resolveFromResults({ nounGroups, keywordMap, batchResults, subtreeResultsMap = {}, sceneCatalog = [] }) {
  const report = { RESOLVED: [], PARTIAL_MATCH: [], AMBIGUOUS: [], NOT_IN_SCENE: [], pendingSubtrees: [] }

  const workItems = [
    ...nounGroups.groups.map(g => ({ noun: g.parent, children: g.children || [], isGroup: true })),
    ...nounGroups.orphans.map(o => ({ noun: o, children: [], isGroup: false }))
  ]

  // Map each batch hit to the nouns it matches
  const hitsByNoun = {}
  for (const hit of (batchResults || [])) {
    const hitNameLower = hit.name.toLowerCase()
    for (const [kw, nouns] of Object.entries(keywordMap)) {
      if (hitNameLower.includes(kw.toLowerCase())) {
        for (const noun of nouns) {
          if (!hitsByNoun[noun]) hitsByNoun[noun] = []
          if (!hitsByNoun[noun].find(h => h.name === hit.name)) hitsByNoun[noun].push(hit)
        }
      }
    }
  }

  const unresolved = []

  for (const item of workItems) {
    const hits = hitsByNoun[item.noun] || []

    if (hits.length === 0) {
      unresolved.push(item)
      continue
    }

    const best = pickBestHit(hits, item)

    // Inactive or on an animation rig → partial match only
    if (!best.active || /NPC_|#h2\s+animations/i.test(best.path)) {
      report.PARTIAL_MATCH.push({
        sopTerm:           item.noun,
        queryName:         best.name,
        path:              best.path,
        resolvedAtAttempt: 1,
        note:              'Object found but inactive or on NPC/animation rig'
      })
      continue
    }

    // If this noun has SOP children and the hit has children, resolve via subtree
    if (item.children.length > 0 && best.childCount > 0) {
      const subtree = subtreeResultsMap[best.name]

      if (!subtree) {
        // We haven't walked this subtree yet — request it
        report.pendingSubtrees.push(best.name)
        // Still add the parent as resolved
        report.RESOLVED.push({
          sopTerm:           item.noun,
          queryName:         best.name,
          path:              best.path,
          resolvedAtAttempt: 1,
          note:              'Children pending subtree walk'
        })
        continue
      }

      // Subtree available — map children via LLM
      await resolveChildren({ item, best, subtree, report, attempt: 1 })
    } else {
      report.RESOLVED.push({
        sopTerm:           item.noun,
        queryName:         best.name,
        path:              best.path,
        resolvedAtAttempt: 1
      })
    }
  }

  // Attempt 3 for unresolved — LLM reads scene catalog (no Unity call)
  if (unresolved.length > 0 && sceneCatalog.length > 0) {
    await Promise.all(unresolved.map(async (item) => {
      const result = await matchAgainstCatalog(item.noun, sceneCatalog)
      if (!result) {
        report.NOT_IN_SCENE.push({ sopTerm: item.noun, note: 'No match after 3 attempts' })
      } else if (Array.isArray(result)) {
        report.AMBIGUOUS.push({ sopTerm: item.noun, candidates: result, note: 'Multiple candidates — human confirmation needed' })
      } else {
        report.RESOLVED.push({ sopTerm: item.noun, queryName: result, resolvedAtAttempt: 3 })
      }
    }))
  } else {
    for (const item of unresolved) {
      report.NOT_IN_SCENE.push({ sopTerm: item.noun, note: 'No match found in batch results; no scene catalog for attempt 3' })
    }
  }

  return report
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

function pickBestHit(hits, item) {
  const scored = hits.map(hit => {
    let score = 0
    if (/Interactables/i.test(hit.path)) score += 2
    if (hit.active) score += 1
    if (item.children.length > 0 && hit.childCount > 0) score += 1
    return { hit, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].hit
}

async function resolveChildren({ item, best, subtree, report, attempt }) {
  const childNames = subtree.map(n => n.name)
  const mapping    = await mapChildrenToUnity(item.children, childNames)

  for (const [sopChild, unityName] of Object.entries(mapping)) {
    if (unityName) {
      const childHit = subtree.find(n => n.name === unityName)
      report.RESOLVED.push({
        sopTerm:         sopChild,
        queryName:       unityName,
        path:            childHit?.path || `${best.path}/${unityName}`,
        resolvedAtAttempt: attempt,
        parentQueryName: best.name
      })
    } else {
      report.NOT_IN_SCENE.push({
        sopTerm: sopChild,
        note:    `No child match found inside ${best.name} subtree`
      })
    }
  }
}

async function generateSynonyms(noun) {
  try {
    const raw    = await chat({
      systemPrompt: SYNONYM_GENERATION_SYSTEM,
      userMessage:  `Generate Unity asset name alternatives for: "${noun}"`,
      jsonMode:     true
    })
    const parsed = parseLlmJson(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function mapChildrenToUnity(sopChildren, unityChildNames) {
  try {
    const raw = await chat({
      systemPrompt: CHILD_MAPPING_SYSTEM,
      userMessage:
        `SOP child terms:\n${JSON.stringify(sopChildren)}\n\n` +
        `Unity child names:\n${JSON.stringify(unityChildNames)}\n\n` +
        'Return a JSON object mapping each SOP term to the best Unity name or null.',
      jsonMode: true
    })
    const parsed = parseLlmJson(raw)
    const result = {}
    for (const child of sopChildren) result[child] = parsed[child] || null
    return result
  } catch {
    const result = {}
    for (const child of sopChildren) result[child] = null
    return result
  }
}

async function matchAgainstCatalog(noun, catalogNames) {
  try {
    const raw = await chat({
      systemPrompt: CATALOG_MATCH_SYSTEM,
      userMessage:
        `SOP term: "${noun}"\n\n` +
        `Unity scene object names:\n${JSON.stringify(catalogNames)}\n\n` +
        'Return JSON: { "match": "UnityName" | null, "candidates": ["name1","name2"] | null }',
      jsonMode: true
    })
    const parsed = parseLlmJson(raw)
    if (parsed.candidates && Array.isArray(parsed.candidates) && parsed.candidates.length > 1) return parsed.candidates
    if (parsed.match) return parsed.match
    return null
  } catch {
    return null
  }
}

module.exports = {
  extractSopNouns,
  buildKeywordSearch,
  buildBatchSearchCode,
  buildSubtreeWalkCode,
  resolveFromResults
}
