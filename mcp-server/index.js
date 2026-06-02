require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const { McpServer }          = require('@modelcontextprotocol/sdk/server/mcp.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { z }                  = require('zod')
const fs                     = require('fs')
const path                   = require('path')

// ── Domain modules ────────────────────────────────────────────────────────────
const { SERVICES, CORE, INTEGRITY, PIPELINE } = require('../config/constants')

const { indexStoryMoments, searchMoments }              = require(SERVICES.vector)
const { buildRelationshipIndex, extractObjectCatalog }  = require(SERVICES.index)
const { handleRename }                                  = require(SERVICES.diff)
const { getTriggerActionCatalog }                       = require(SERVICES.actions)
const { extractSopContext }                             = require(SERVICES.sop)
const { planStory, generateAllMoments, assembleFinalJson } = require(SERVICES.creation)
const { generateSFXForStory }                              = require(SERVICES.sfx)
const { extractSopNouns, buildBatchSearchCode, buildSubtreeWalkCode, resolveFromResults } = require(SERVICES.resolver)

const workspaceContext   = require(CORE.workspaceContext)
const sessionStore       = require(CORE.sessionStore)
const { clip }           = require(CORE.contextReducer)
const { guard, ok, err } = require(CORE.toolRegistry)

const { buildMerkleTree } = require(INTEGRITY.merkleTree)
const { applyAtomic }     = require(PIPELINE.executor)
const { assertStory }     = require(PIPELINE.verifier)

// ── PDF text extraction helper ────────────────────────────────────────────────
/**
 * Extract plain text from a PDF using pdf2json.
 * Handles scanned-image PDFs gracefully — returns whatever text layer exists.
 *
 * @param {string} filePath absolute path to the .pdf file
 * @returns {Promise<string>}
 */
function extractPdfText(filePath) {
  const PDFParser = require('pdf2json')
  const parser    = new PDFParser()
  return new Promise((resolve, reject) => {
    parser.on('pdfParser_dataReady', (data) => {
      let text = ''
      for (const page of data.Pages || []) {
        for (const t of page.Texts || []) {
          for (const r of t.R || []) {
            try { text += decodeURIComponent(r.T) + ' ' } catch { text += r.T + ' ' }
          }
        }
        text += '\n'
      }
      resolve(text.trim())
    })
    parser.on('pdfParser_dataError', (errData) =>
      reject(new Error(errData?.parserError || 'PDF parse error'))
    )
    parser.loadPDF(filePath)
  })
}

// ── MCP server ────────────────────────────────────────────────────────────────
const server = new McpServer({ name: 'vrsebuilder-tools', version: '1.0.0' })

// Adapt guard()-wrapped execute(_id, params) → MCP handler(args)
const fromGuard = (guardedFn) => (args) => guardedFn(null, args)

// ─── 1. load_story ────────────────────────────────────────────────────────────
server.registerTool(
  'load_story',
  {
    description:
      'Load a VrseBuilder story JSON from a file path or raw JSON string. ' +
      'Builds the relationship index, Merkle tree, and indexes moments into Pinecone. ' +
      'Resumes any prior session. Must be called before any other tool.',
    inputSchema: {
      storyId:  z.string().describe('Unique ID for this story (e.g. "my-story")'),
      filePath: z.string().optional().describe('Absolute path to story JSON. Omit if using rawJson.'),
      rawJson:  z.string().optional().describe('Raw story JSON string. Omit if using filePath.')
    }
  },
  async (args) => {
    try {
      let storyJson
      if (args.filePath) {
        storyJson = JSON.parse(fs.readFileSync(args.filePath, 'utf-8'))
      } else if (args.rawJson) {
        storyJson = JSON.parse(args.rawJson)
      } else {
        return err('Provide either filePath or rawJson')
      }

      const relationshipIndex = buildRelationshipIndex(storyJson)
      const objectCatalog     = extractObjectCatalog(storyJson)
      const merkleTree        = buildMerkleTree(relationshipIndex.momentChain, storyJson)

      await indexStoryMoments(args.storyId, relationshipIndex.momentChain)

      workspaceContext.setContext(args.storyId, {
        storyJson,
        relationshipIndex,
        objectCatalog,
        merkleTree
      })

      const session = sessionStore.resume(args.storyId)

      return ok({
        momentCount:        relationshipIndex.momentChain.length,
        chapters:           storyJson.chapters.length,
        objects:            objectCatalog.length,
        storyContextHeader: relationshipIndex.storyContextHeader,
        merkleRoot:         merkleTree.root,
        priorEdits:         session.changelog.length
      })
    } catch (e) {
      return err(e.message)
    }
  }
)

// ─── 2. load_scene_awareness ──────────────────────────────────────────────────
server.registerTool(
  'load_scene_awareness',
  {
    description:
      'Load a free-form scene description text file and attach it to the story session. ' +
      'The text is injected into the stable KV-cache prefix so it is computed once and ' +
      'reused every turn. Also identifies which catalog objects are confirmed in the scene. ' +
      'Call after load_story.',
    inputSchema: {
      storyId:  z.string(),
      filePath: z.string().describe('Absolute path to the scene awareness text file')
    }
  },
  async (args) => {
    const ctx = workspaceContext.getContext(args.storyId)
    if (!ctx) return err('Story not loaded. Call load_story first.')

    try {
      const rawText = fs.readFileSync(args.filePath, 'utf-8')
      const confirmedObjects = ctx.objectCatalog.filter(q => rawText.includes(q))
      workspaceContext.setSceneAwareness(args.storyId, rawText, confirmedObjects)

      return ok({
        characters:         rawText.length,
        confirmedObjects,
        unconfirmedObjects: ctx.objectCatalog.filter(q => !confirmedObjects.includes(q))
      })
    } catch (e) {
      return err(`Failed to read scene file: ${e.message}`)
    }
  }
)

// ─── 3. search_moments ────────────────────────────────────────────────────────
server.registerTool(
  'search_moments',
  {
    description: 'Semantic search for story moments. Returns top-K with relevance scores.',
    inputSchema: {
      storyId: z.string(),
      query:   z.string(),
      topK:    z.number().optional().describe('Number of results (default 3)')
    }
  },
  fromGuard(guard(async (params, _ctx) => {
    return await searchMoments(params.storyId, params.query, params.topK || 3)
  }))
)

// ─── 4. get_moment_json ───────────────────────────────────────────────────────
server.registerTool(
  'get_moment_json',
  {
    description:
      'Get the full JSON of one moment by global index. ' +
      'Prefer search_moments first to find the right index.',
    inputSchema: {
      storyId:     z.string(),
      globalIndex: z.number()
    }
  },
  fromGuard(guard((params, ctx) => {
    const entry = ctx.relationshipIndex.momentChain[params.globalIndex]
    if (!entry) throw new Error(`Moment ${params.globalIndex} not found`)

    const momentJson = ctx.storyJson.chapters[entry.chapterIndex]?.moments[entry.localIndex]
    if (!momentJson) throw new Error('Moment JSON missing from story')

    return {
      globalIndex: params.globalIndex,
      chapterIndex: entry.chapterIndex,
      localIndex: entry.localIndex,
      momentName: entry.momentName,
      momentJson
    }
  }))
)

// ─── 5. get_chain_context ─────────────────────────────────────────────────────
server.registerTool(
  'get_chain_context',
  {
    description: 'Get entry/exit state, prev/next moment summaries for a moment.',
    inputSchema: {
      storyId:     z.string(),
      globalIndex: z.number()
    }
  },
  fromGuard(guard((params, ctx) => {
    const { momentChain } = ctx.relationshipIndex
    const entry = momentChain[params.globalIndex]
    if (!entry) throw new Error(`Moment ${params.globalIndex} not found`)

    const prev = momentChain[params.globalIndex - 1] || null
    const next = momentChain[params.globalIndex + 1] || null

    return {
      globalIndex: params.globalIndex,
      momentName:  entry.momentName,
      entryState:  entry.entryState,
      exitState:   entry.exitState,
      prevMoment:  prev ? { globalIndex: prev.globalIndex, name: prev.momentName, exitState: prev.exitState } : null,
      nextMoment:  next ? { globalIndex: next.globalIndex, name: next.momentName, entryState: next.entryState } : null
    }
  }))
)

// ─── 6. get_object_map ────────────────────────────────────────────────────────
server.registerTool(
  'get_object_map',
  {
    description: 'Look up all moments that reference a specific Query name.',
    inputSchema: {
      storyId:    z.string(),
      objectName: z.string()
    }
  },
  fromGuard(guard((params, ctx) => {
    return ctx.relationshipIndex.objectMap[params.objectName] || []
  }))
)

// ─── 7. get_action_catalog ────────────────────────────────────────────────────
server.registerTool(
  'get_action_catalog',
  {
    description: 'Get all valid Query names used in this story.',
    inputSchema: {
      storyId: z.string()
    }
  },
  fromGuard(guard((params, ctx) => ctx.objectCatalog))
)

// ─── 8. get_trigger_action_catalog ────────────────────────────────────────────
server.registerTool(
  'get_trigger_action_catalog',
  {
    description:
      'Fetch the platform catalog of available triggerActionSets — action types and trigger ' +
      'types — from the Infinity Workshop API. Returns the full list of what Name/Option combos ' +
      'and trigger types the platform supports. Cached once per server session. ' +
      'Call this before creating a new moment so you know what actions and triggers are valid.',
    inputSchema: {
      type: z.enum(['actions', 'triggers', 'all']).optional()
        .describe('Which catalog to return: "actions", "triggers", or "all" (default)')
    }
  },
  async (args) => {
    try {
      const result = await getTriggerActionCatalog(args.type || 'all')
      return ok(result)
    } catch (e) {
      return err(e.message)
    }
  }
)

// ─── 9. get_story_context ────────────────────────────────────────────────────
server.registerTool(
  'get_story_context',
  {
    description:
      'Get the story context header, session summary, scene awareness status, and Merkle root. ' +
      'Always call this first before any edit — it is the stable KV-cache prefix anchor.',
    inputSchema: {
      storyId: z.string()
    }
  },
  fromGuard(guard((params, ctx) => {
    const scene = workspaceContext.getSceneAwareness(params.storyId)
    return {
      storyContextHeader:    ctx.relationshipIndex.storyContextHeader,
      sessionSummary:        sessionStore.summarise(params.storyId),
      merkleRoot:            workspaceContext.getMerkleRootForStory(params.storyId),
      sceneAwarenessLoaded:  !!scene.text,
      sceneAwarenessText:    scene.text || null,
      confirmedSceneObjects: scene.confirmedObjects
    }
  }))
)

// ─── 10. get_relevant_moments ─────────────────────────────────────────────────
server.registerTool(
  'get_relevant_moments',
  {
    description:
      'Return only the moments relevant to a query (token-budget aware). ' +
      'Use this instead of fetching all moments one by one.',
    inputSchema: {
      storyId:    z.string(),
      query:      z.string(),
      maxMoments: z.number().optional().describe('Max moments to return (default 5)')
    }
  },
  fromGuard(guard((params, ctx) => {
    const clipped = clip(ctx.relationshipIndex.momentChain, params.query, params.maxMoments || 5)
    return clipped.map(entry => {
      const momentJson = ctx.storyJson.chapters[entry.chapterIndex]?.moments[entry.localIndex]
      return { ...entry, momentJson }
    })
  }))
)

// ─── 11. apply_diffs ──────────────────────────────────────────────────────────
server.registerTool(
  'apply_diffs',
  {
    description:
      'Atomically validate, apply, and verify field-level diffs. ' +
      'Includes Merkle integrity check, schema validation, post-apply assertions, ' +
      'and automatic rollback on any failure. ' +
      'Use this for editing fields on existing moments. ' +
      'For structural ops (add/remove/reorder moments), write a Node script and exec it instead.',
    inputSchema: {
      storyId:         z.string(),
      diffs:           z.array(z.object({}).passthrough()).describe('Array of { momentGlobalIndex, changes[], changeLog }'),
      skipMerkleCheck: z.boolean().optional().describe('Skip out-of-band edit detection (default false)')
    }
  },
  async (args) => {
    const result = await applyAtomic(
      args.storyId,
      args.diffs,
      { skipMerkleCheck: args.skipMerkleCheck || false }
    )
    return ok(result)
  }
)

// ─── 12. rename_object ────────────────────────────────────────────────────────
server.registerTool(
  'rename_object',
  {
    description:
      'Rename a Query name across all moments in the story. ' +
      'Builds rename diffs automatically then applies them atomically.',
    inputSchema: {
      storyId:    z.string(),
      renameFrom: z.string().describe('Exact current Query name'),
      renameTo:   z.string().describe('New Query name')
    }
  },
  async (args) => {
    const ctx = workspaceContext.getContext(args.storyId)
    if (!ctx) return err('Story not loaded. Call load_story first.')

    const { momentChain } = ctx.relationshipIndex
    const refs = ctx.relationshipIndex.objectMap[args.renameFrom] || []

    if (refs.length === 0) return err(`Query "${args.renameFrom}" not found in story`)

    const editPlan = {
      renameFrom:    args.renameFrom,
      renameTo:      args.renameTo,
      targetMoments: refs
    }

    const { diffs } = handleRename(editPlan, ctx.storyJson, momentChain)
    if (diffs.length === 0) return ok({ renamed: 0, message: 'No changes needed' })

    const result = await applyAtomic(args.storyId, diffs)
    return ok({ ...result, affectedMoments: refs.length })
  }
)

// ─── 13. verify_story ─────────────────────────────────────────────────────────
server.registerTool(
  'verify_story',
  {
    description:
      'Run all post-apply assertions on the current cached story without modifying it. ' +
      'Use to audit story integrity at any time.',
    inputSchema: {
      storyId: z.string()
    }
  },
  fromGuard(guard((params, ctx) => {
    return assertStory(ctx.storyJson)
  }))
)

// ─── 14. add_session_note ─────────────────────────────────────────────────────
server.registerTool(
  'add_session_note',
  {
    description: 'Record a free-form agent observation to the session store.',
    inputSchema: {
      storyId: z.string(),
      note:    z.string()
    }
  },
  fromGuard(guard((params, _ctx) => {
    sessionStore.note(params.storyId, params.note)
    return { recorded: true }
  }))
)

// ─── 15. save_story ───────────────────────────────────────────────────────────
server.registerTool(
  'save_story',
  {
    description: 'Write the current (modified) story JSON to a file.',
    inputSchema: {
      storyId:  z.string(),
      filePath: z.string().describe('Absolute path to write the JSON to')
    }
  },
  async (args) => {
    const ctx = workspaceContext.getContext(args.storyId)
    if (!ctx) return err('Story not loaded. Call load_story first.')

    try {
      const dir = path.dirname(args.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(args.filePath, JSON.stringify(ctx.storyJson, null, 2), 'utf-8')
      return ok({ saved: true, path: args.filePath })
    } catch (e) {
      return err(`Failed to write file: ${e.message}`)
    }
  }
)

// ─── 16. load_sop ─────────────────────────────────────────────────────────────
server.registerTool(
  'load_sop',
  {
    description:
      'Load a Standard Operating Procedure (SOP) or training document and extract structured ' +
      'context (objectives, procedures, equipment, constraints) via one LLM call. ' +
      'Supports .txt, .md, .json, and .pdf files. ' +
      'Stores the result in workspaceContext and sessionStore so it is available to ' +
      'create_story without re-reading the file. ' +
      'Call this when the user uploads or references a SOP/training document. ' +
      'Does NOT require load_story to have been called first.',
    inputSchema: {
      storyId:  z.string().describe('Story ID to associate this SOP context with'),
      filePath: z.string().describe('Absolute path to the SOP file (txt, md, json, pdf)')
    }
  },
  async (args) => {
    try {
      let rawText
      if (args.filePath.toLowerCase().endsWith('.pdf')) {
        rawText = await extractPdfText(args.filePath)
      } else {
        rawText = fs.readFileSync(args.filePath, 'utf-8')
      }
      if (!rawText || !rawText.trim()) return err('SOP file is empty or could not be extracted')

      const sopContext = await extractSopContext(rawText)

      workspaceContext.setSopContext(args.storyId, sopContext)
      sessionStore.saveSopContext(args.storyId, sopContext)

      return ok({
        loaded:      true,
        objectives:  sopContext.objectives,
        procedures:  sopContext.procedures,
        equipment:   sopContext.equipment,
        constraints: sopContext.constraints || 'none'
      })
    } catch (e) {
      return err(`load_sop failed: ${e.message}`)
    }
  }
)

// ─── 17. create_story ─────────────────────────────────────────────────────────
server.registerTool(
  'create_story',
  {
    description:
      'Create a new VrseBuilder story JSON from a brief or loaded SOP context. ' +
      'Uses a two-phase confirm flag to control cost:\n' +
      '  confirm:false (default) — runs one planning LLM call, returns the structured plan ' +
      '(chapter names, moment names, count) for agent review. Cheap. Re-call with a revised ' +
      'brief to replan.\n' +
      '  confirm:true — reads the saved plan and fires all moment generation calls in parallel ' +
      '(one LLM call per moment simultaneously). Retries failures up to 3 times. ' +
      'Writes the assembled story JSON to outputFilePath.\n\n' +
      'After confirm:true completes, call load_story → verify_story → save_story.',
    inputSchema: {
      storyId:        z.string(),
      outputFilePath: z.string().describe('Absolute path where the generated story JSON will be written'),
      brief:          z.string().optional().describe('Free-text description of the story. If omitted, uses sopContext from load_sop.'),
      confirm:        z.boolean().optional().describe('false: plan only. true: generate all moments in parallel.'),
      generationOptions: z.object({
        allowedActions:  z.array(z.string()).optional(),
        allowedTriggers: z.array(z.string()).optional()
      }).optional()
    }
  },
  async (args) => {
    const { storyId, outputFilePath, brief, confirm = false } = args

    try {
      // ── Phase 1: Plan only ────────────────────────────────────────────────
      if (!confirm) {
        const catalog        = await getTriggerActionCatalog('all')
        const sopContext     = workspaceContext.getSopContext(storyId)
                           || sessionStore.loadSopContext(storyId)
        const sceneData      = workspaceContext.getSceneAwareness(storyId)
        const sceneAwareness = sceneData.text || null

        if (!brief && !sopContext && !sceneAwareness) {
          return err(
            'No context available to plan a story. ' +
            'Provide a brief, call load_sop with a SOP file, or call load_scene_awareness with a scene file first.'
          )
        }

        const catalogText = JSON.stringify(catalog, null, 2)
        const plan = await planStory({ brief, sopContext, sceneAwareness, catalogText })

        workspaceContext.setPendingPlan(storyId, plan)
        sessionStore.savePendingPlan(storyId, plan)

        const totalMoments = plan.chapters.reduce((s, c) => s + c.moments.length, 0)

        return ok({
          phase:         'plan',
          storyName:     plan.storyName,
          totalChapters: plan.chapters.length,
          totalMoments,
          plan,
          message:
            `Plan ready: ${plan.chapters.length} chapter(s), ${totalMoments} moment(s). ` +
            'Review the plan above. If satisfied, call create_story with confirm:true to generate. ' +
            'To adjust, call again with confirm:false and a revised brief.'
        })
      }

      // ── Phase 2: Generate ─────────────────────────────────────────────────
      const plan = workspaceContext.getPendingPlan(storyId)
                || sessionStore.loadPendingPlan(storyId)

      if (!plan) {
        return err('No pending plan found. Call create_story with confirm:false first to generate a plan.')
      }

      const catalog        = await getTriggerActionCatalog('all')
      const sceneData      = workspaceContext.getSceneAwareness(storyId)
      const sceneAwareness = sceneData.text || null
      const catalogText    = JSON.stringify(catalog, null, 2)

      const { moments, failed } = await generateAllMoments({ plan, catalogText, sceneAwareness })
      const jsonData = assembleFinalJson({ plan, moments })

      // Generate real SFX audio for all GENERATE_THIS placeholders in the story
      const sfxResult = await generateSFXForStory(jsonData, storyId)
      sessionStore.note(
        storyId,
        `SFX generation: ${sfxResult.totalUpdates} generated, ${sfxResult.totalErrors} errors`
      )

      const dir = path.dirname(outputFilePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf-8')

      const totalMoments   = plan.chapters.reduce((s, c) => s + c.moments.length, 0)
      const failedMoments  = failed.length
      const successMoments = totalMoments - failedMoments

      sessionStore.note(
        storyId,
        `Story created: "${plan.storyName}" — ${successMoments}/${totalMoments} moments generated. Written to ${outputFilePath}`
      )

      return ok({
        phase:          'generated',
        storyName:      plan.storyName,
        totalChapters:  plan.chapters.length,
        totalMoments,
        successMoments,
        failedMoments,
        failedNames:    failed.map(s => s.name),
        sfx: {
          generated: sfxResult.totalUpdates,
          errors:    sfxResult.totalErrors,
        },
        outputFilePath,
        message:
          failedMoments > 0
            ? `${failedMoments} moment(s) failed after 3 retries: ${failed.map(s => s.name).join(', ')}. ` +
              'Call load_story then use apply_diffs to fix failed moments manually.'
            : sfxResult.totalErrors > 0
              ? `All moments generated. ${sfxResult.totalErrors} SFX failed — call generate_sfx to retry. ` +
                'Then call load_story → verify_story.'
              : 'All moments generated with SFX. Call load_story to load into context, then verify_story.'
      })
    } catch (e) {
      return err(`create_story failed: ${e.message}`)
    }
  }
)

// ─── 18. generate_moments ─────────────────────────────────────────────────────
server.registerTool(
  'generate_moments',
  {
    description:
      'Generate new VrseBuilder moments in parallel for an EXISTING loaded story. ' +
      'Use when the user asks to add moments, add a chapter, or redesign part of the flow.\n\n' +
      'confirm:false (default) — planning call only, returns the moment plan for review.\n' +
      'confirm:true — fires all moment generation calls in parallel, returns the raw moment ' +
      'objects. Agent then writes an exec script to splice them into the existing story JSON, ' +
      'followed by load_story → verify_story.\n\n' +
      'IMPORTANT: Call get_story_context first and pass its output as existingStoryContext so ' +
      'the planner knows what chapters, objects, and moments already exist.',
    inputSchema: {
      storyId:              z.string(),
      brief:                z.string().describe('What to generate, e.g. "Add 3 moments to chapter 2 about valve inspection"'),
      existingStoryContext: z.string().optional().describe('Output of get_story_context — tells planner what already exists'),
      confirm:              z.boolean().optional().describe('false: plan only. true: generate all moments in parallel and return raw array.')
    }
  },
  async (args) => {
    const { storyId, brief, existingStoryContext, confirm = false } = args

    try {
      const catalog        = await getTriggerActionCatalog('all')
      const sopContext     = workspaceContext.getSopContext(storyId)
                         || sessionStore.loadSopContext(storyId)
      const sceneData      = workspaceContext.getSceneAwareness(storyId)
      const sceneAwareness = sceneData.text || null
      const catalogText    = JSON.stringify(catalog, null, 2)

      const fullBrief = existingStoryContext
        ? `EXISTING STORY CONTEXT (do NOT recreate these — only design the NEW moments requested):\n${existingStoryContext}\n\nREQUEST FOR NEW MOMENTS:\n${brief}`
        : brief

      // ── Phase 1: Plan only ──────────────────────────────────────────────
      if (!confirm) {
        const plan = await planStory({ brief: fullBrief, sopContext, sceneAwareness, catalogText })

        workspaceContext.setPendingPlan(storyId, { ...plan, _source: 'generate_moments' })
        sessionStore.savePendingPlan(storyId, { ...plan, _source: 'generate_moments' })

        const totalMoments = plan.chapters.reduce((s, c) => s + c.moments.length, 0)

        return ok({
          phase:         'plan',
          totalChapters: plan.chapters.length,
          totalMoments,
          plan,
          message:
            `Plan ready: ${plan.chapters.length} chapter group(s), ${totalMoments} new moment(s). ` +
            'Review the plan. Call generate_moments with confirm:true to generate. ' +
            'To adjust, call again with confirm:false and a revised brief.'
        })
      }

      // ── Phase 2: Generate and return raw moments ────────────────────────
      const plan = workspaceContext.getPendingPlan(storyId)
                || sessionStore.loadPendingPlan(storyId)

      if (!plan) {
        return err('No pending plan found. Call generate_moments with confirm:false first.')
      }

      const { moments, failed } = await generateAllMoments({ plan, catalogText, sceneAwareness })

      const generatedMoments = plan.chapters.flatMap((ch, ci) =>
        ch.moments.map((m, mi) => {
          const generated = moments.get(`ch${ci}_m${mi}`)
          if (!generated) return null
          return {
            suggestedChapterIndex: ci,
            suggestedChapterName:  ch.name,
            localMomentIndex:      mi,
            generatedMoment: { ...generated, name: m.name, momentIndex: mi }
          }
        }).filter(Boolean)
      )

      const totalMoments   = plan.chapters.reduce((s, c) => s + c.moments.length, 0)
      const failedMoments  = failed.length
      const successMoments = totalMoments - failedMoments

      sessionStore.note(
        storyId,
        `generate_moments: ${successMoments}/${totalMoments} new moments generated. Chapters: ${plan.chapters.map(c => c.name).join(', ')}`
      )

      return ok({
        phase:           'generated',
        totalMoments,
        successMoments,
        failedMoments,
        failedNames:     failed.map(s => s.name),
        generatedMoments,
        message:
          failedMoments > 0
            ? `${failedMoments} moment(s) failed after 3 retries: ${failed.map(s => s.name).join(', ')}. ` +
              'Write a splice script for the successful moments, then fix failures with apply_diffs.'
            : `All ${successMoments} moments generated. Write an exec script to splice them into the story, then call load_story → verify_story.`
      })
    } catch (e) {
      return err(`generate_moments failed: ${e.message}`)
    }
  }
)

// ─── 19. generate_sfx ────────────────────────────────────────────────────────
server.registerTool(
  'generate_sfx',
  {
    description:
      'Generate real SFX audio for all GENERATE_THIS placeholder URLs in an existing story file. ' +
      'Uses ElevenLabs text-to-sound-effects to convert each audioClipName into an audio file, ' +
      'uploads to S3, and patches the story JSON in place. ' +
      'Use this after create_story if SFX generation had errors, or to add real audio to any story file. ' +
      'Call load_story after this to reload the updated context.',
    inputSchema: {
      storyId:  z.string().describe('Story ID (used for S3 path prefix and session notes)'),
      filePath: z.string().describe('Absolute path to the story JSON file to process')
    }
  },
  async (args) => {
    const { storyId, filePath } = args

    try {
      if (!fs.existsSync(filePath)) {
        return err(`File not found: ${filePath}`)
      }

      const storyJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      const sfxResult = await generateSFXForStory(storyJson, storyId)

      // Write the patched story back to disk
      fs.writeFileSync(filePath, JSON.stringify(storyJson, null, 2), 'utf-8')

      sessionStore.note(
        storyId,
        `generate_sfx: ${sfxResult.totalUpdates} generated, ${sfxResult.totalErrors} errors. File: ${filePath}`
      )

      return ok({
        generated:    sfxResult.totalUpdates,
        errors:       sfxResult.totalErrors,
        results:      sfxResult.results,
        filePath,
        message:
          sfxResult.totalErrors > 0
            ? `${sfxResult.totalUpdates} SFX generated. ${sfxResult.totalErrors} failed — re-run generate_sfx to retry remaining placeholders. Then call load_story.`
            : sfxResult.totalUpdates === 0
              ? 'No GENERATE_THIS placeholders found in this story. Nothing to generate.'
              : `All ${sfxResult.totalUpdates} SFX generated successfully. Call load_story to reload context.`
      })
    } catch (e) {
      return err(`generate_sfx failed: ${e.message}`)
    }
  }
)

// ─── 20. resolve_scene_objects ────────────────────────────────────────────────
server.registerTool(
  'resolve_scene_objects',
  {
    description:
      'Resolve SOP physical-object nouns to confirmed Unity scene objects. ' +
      'Two-step flow:\n\n' +
      'STEP 1 — call with storyId + sceneCatalog (root object names from unity_scene_hierarchy ' +
      'maxDepth=1 maxNodes=200). The tool extracts nouns from the loaded SOP, expands keywords ' +
      'and synonyms via LLM, stores intermediate state, and returns a batchSearchCode (C#) for ' +
      'you to run with unity_execute_code.\n\n' +
      'STEP 2 — after running unity_execute_code with batchSearchCode, call again with ' +
      'batchResultsJson (the raw JSON result from unity_execute_code). For any parent objects ' +
      'returned in pendingSubtrees, run unity_execute_code with each subtreeCode and pass all ' +
      'results back in subtreeResultsJson.\n\n' +
      'TIP: Step 1 returns keywordMap, nounGroups, and sceneCatalog in its output. Pass these ' +
      'back as prepareStateJson in step 2 to make the call stateless — this avoids failures if ' +
      'resolver state is lost between calls.\n\n' +
      'After STEP 2, confirmed objects are stored in workspaceContext and available to ' +
      'get_story_context. Review AMBIGUOUS and NOT_IN_SCENE before calling create_story.\n\n' +
      'Requires: load_sop must have been called first.',
    inputSchema: {
      storyId: z.string(),

      // Step 1 inputs
      sceneCatalog: z.array(z.string()).optional()
        .describe('Root object names from unity_scene_hierarchy(maxDepth=1, maxNodes=200). Required for step 1.'),

      // Step 2 inputs
      batchResultsJson: z.string().optional()
        .describe('JSON string of unity_execute_code results from the batchSearchCode. Triggers step 2.'),
      subtreeResultsJson: z.string().optional()
        .describe('JSON object mapping objectName → subtree result array from unity_execute_code. Provide alongside batchResultsJson when subtree walks are complete.'),
      prepareStateJson: z.string().optional()
        .describe('JSON string of { nounGroups, keywordMap, sceneCatalog } from step 1 output. Provide this to make step 2 stateless — the tool uses it instead of reading from stored resolver state. Strongly recommended when calling from a subagent context.')
    }
  },
  async (args) => {
    const { storyId, sceneCatalog, batchResultsJson, subtreeResultsJson, prepareStateJson } = args

    // Guard: sopContext must exist
    const sopContext = workspaceContext.getSopContext(storyId)
                    || sessionStore.loadSopContext(storyId)
    if (!sopContext) {
      return err('No SOP context found. Call load_sop first.')
    }

    try {
      // ── Step 1: extract nouns + build batch search code ──────────────────
      if (!batchResultsJson) {
        if (!sceneCatalog || sceneCatalog.length === 0) {
          return err(
            'sceneCatalog is required for step 1. ' +
            'Call unity_scene_hierarchy(maxDepth=1, maxNodes=200) first and pass the root object names here.'
          )
        }

        const prepareResult = await extractSopNouns(sopContext)

        // Store intermediate state for step 2
        workspaceContext.setResolverState(storyId, {
          nounGroups:  prepareResult.nounGroups,
          keywordMap:  prepareResult.keywordMap,
          sceneCatalog
        })

        const nounCount = prepareResult.nounGroups.groups.length + prepareResult.nounGroups.orphans.length

        return ok({
          step:            1,
          nounCount,
          nounGroups:      prepareResult.nounGroups,
          keywordMap:      prepareResult.keywordMap,
          sceneCatalog,
          keywordCount:    prepareResult.allKeywords.length,
          batchSearchCode: prepareResult.batchSearchCode,
          message:
            `Step 1 complete: extracted ${nounCount} noun(s). ` +
            'Run unity_execute_code with batchSearchCode, then call resolve_scene_objects again with ' +
            'batchResultsJson AND prepareStateJson (JSON.stringify({ nounGroups, keywordMap, sceneCatalog }) from this output).'
        })
      }

      // ── Step 2: resolve from search results ──────────────────────────────
      let resolverState
      if (prepareStateJson) {
        try {
          resolverState = JSON.parse(prepareStateJson)
        } catch {
          return err('prepareStateJson must be a valid JSON string of { nounGroups, keywordMap, sceneCatalog }.')
        }
      } else {
        resolverState = workspaceContext.getResolverState(storyId)
      }
      if (!resolverState) {
        return err('No resolver state found. Either provide prepareStateJson (the nounGroups/keywordMap/sceneCatalog from step 1 output) or call step 1 first.')
      }

      let batchResults = []
      try {
        batchResults = JSON.parse(batchResultsJson)
        if (!Array.isArray(batchResults)) batchResults = []
      } catch {
        return err('batchResultsJson must be a valid JSON array string.')
      }

      let subtreeResultsMap = {}
      if (subtreeResultsJson) {
        try {
          subtreeResultsMap = JSON.parse(subtreeResultsJson)
        } catch {
          return err('subtreeResultsJson must be a valid JSON object string.')
        }
      }

      const report = await resolveFromResults({
        nounGroups:        resolverState.nounGroups,
        keywordMap:        resolverState.keywordMap,
        batchResults,
        subtreeResultsMap,
        sceneCatalog:      resolverState.sceneCatalog
      })

      // If subtree walks are still pending, return their codes and don't store yet
      if (report.pendingSubtrees.length > 0) {
        const subtreeCodes = {}
        for (const objectName of report.pendingSubtrees) {
          subtreeCodes[objectName] = buildSubtreeWalkCode(objectName)
        }
        return ok({
          step:           '2-pending',
          pendingSubtrees: report.pendingSubtrees,
          subtreeCodes,
          partialReport:  report,
          message:
            `Run unity_execute_code for each subtreeCode, then call resolve_scene_objects again with ` +
            `batchResultsJson (same as before) and subtreeResultsJson (map of objectName → result array).`
        })
      }

      // All done — store confirmed objects
      const confirmedObjects = report.RESOLVED.map(r => r.queryName).filter(Boolean)
      workspaceContext.setSceneAwareness(
        storyId,
        JSON.stringify(report, null, 2),
        confirmedObjects
      )

      try {
        sessionStore.note(
          storyId,
          `resolve_scene_objects: ${report.RESOLVED.length} resolved, ` +
          `${report.AMBIGUOUS.length} ambiguous, ${report.NOT_IN_SCENE.length} not found`
        )
      } catch { /* session may not be initialized in subagent contexts — non-fatal */ }

      return ok({
        step:             2,
        RESOLVED:         report.RESOLVED,
        PARTIAL_MATCH:    report.PARTIAL_MATCH,
        AMBIGUOUS:        report.AMBIGUOUS,
        NOT_IN_SCENE:     report.NOT_IN_SCENE,
        confirmedObjects,
        message:
          `Resolution complete. ${report.RESOLVED.length} confirmed, ` +
          `${report.AMBIGUOUS.length} ambiguous, ${report.NOT_IN_SCENE.length} not found. ` +
          (report.AMBIGUOUS.length > 0
            ? 'Review AMBIGUOUS entries before calling create_story. '
            : '') +
          'Confirmed objects are now in workspaceContext (visible via get_story_context).'
      })
    } catch (e) {
      return err(`resolve_scene_objects failed: ${e.message}`)
    }
  }
)

// ─── Start ────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('VrseBuilder MCP server running on stdio\n')
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e.message}\n`)
  process.exit(1)
})
