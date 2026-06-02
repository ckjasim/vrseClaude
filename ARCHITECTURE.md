# jsonClaw Architecture

> Last updated: April 2026

---

## Philosophy

**Tools are leverage, not a cage.**

The agent decides *when* to use Pinecone, *when* to call merkle check, *when* to apply_diffs, and *when* to just write a Node script and run it. There is no forced step sequence — the agent reasons over the available tools and picks what fits the problem.

- **Predefined tools** handle retrieval and safety-critical operations (apply with rollback, verify, create)
- **`exec` / `write` / `read`** (Claude Code built-ins) handle anything structural or one-off
- **The LLM** handles intent classification, blast radius estimation, and delegation decisions

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YOU (Claude Code CLI)                              │
│              "Change the VO text in moment 5 to say hello"                  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MCP SERVER  (mcp-server/index.js)                       │
│  Transport: stdio via .mcp.json                                             │
│  Registers 20 tools via @modelcontextprotocol/sdk                           │
│  Shares domain modules: core/, services/, pipeline/, integrity/             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT  (Claude via Claude Code)             │
│                                                                             │
│  Principles (not steps):                                                    │
│  · Estimate how many moments are affected before acting                     │
│  · If > 5 moments or unclear scope, ask the user first                      │
│  · For field edits → use apply_diffs (atomic + rollback)                   │
│  · For structural ops (reorder, insert, migrate) → write + exec a script   │
│  · Always verify_story after significant changes                            │
│  · Save session notes with add_session_note                                 │
│                                                                             │
│  Tools available: all 20 MCP tools + exec / write / read                   │
└──────┬─────────────────────────────────┬────────────────────────────────────┘
       │ spawns subagents                │ calls tools directly
       ▼                                 ▼
┌────────────────────┐   ┌──────────────────────────────────────────────────┐
│  SPECIALIST        │   │              TOOL LAYER                          │
│  AGENTS            │   │         (mcp-server/index.js)                    │
│                    │   │                                                  │
│ text-editor        │   │  Each tool registered via server.registerTool()  │
│ struct-editor      │   │  with Zod inputSchema                            │
│ redesign-editor    │   │                                                  │
│ continuity-fixer   │   │  Tools call into core/, integrity/, pipeline/    │
└────────────────────┘   └──────────────────────────────────────────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          ▼                                ▼                                ▼
┌──────────────────┐          ┌──────────────────────┐         ┌───────────────────┐
│  workspaceContext│          │  sessionStore         │         │  vectorService    │
│  (RAM, Map)      │          │  (sessions/id.json)   │         │  (Pinecone cloud) │
└──────────────────┘          └──────────────────────┘         └───────────────────┘
          │
          │ on apply_diffs
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ATOMIC PIPELINE (executor.js)                         │
│                                                                             │
│  snapshot → merkleCheck → validate → apply →                               │
│  postVerify → updateContext → updateMerkle → recordSession                  │
│                                                                             │
│  Any failure at any step → restore(snapshot) → story never corrupted       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How the MCP Server Works

```
start.ps1
  ↓
launches: claude  (Claude Code CLI)
  ↓
.mcp.json auto-starts:
  node mcp-server/index.js  (stdio transport)
  ↓
server.registerTool() called 18 times
  ↓
tools are live in the Claude Code agent's tool loop
```

---

## All 20 Tools

| # | Tool | What it does | What it touches |
|---|------|-------------|-----------------|
| 1 | `load_story` | Reads story JSON, builds all indexes | workspaceContext, sessionStore, Pinecone |
| 2 | `load_scene_awareness` | Reads a text file describing the scene | workspaceContext (sceneAwareness) |
| 3 | `search_moments` | Semantic vector search over moments | Pinecone |
| 4 | `get_moment_json` | Returns full JSON of one moment | workspaceContext |
| 5 | `get_chain_context` | Returns prev/next moment state | workspaceContext |
| 6 | `get_object_map` | Lists every moment that references an object | workspaceContext |
| 7 | `get_action_catalog` | Lists all valid Query names in the story | workspaceContext |
| 8 | `get_trigger_action_catalog` | Fetches valid action/trigger types from Infinity Workshop API | actionsService (cached) |
| 9 | `get_story_context` | Returns story header + session summary + merkle root + confirmedSceneObjects | workspaceContext, sessionStore |
| 10 | `get_relevant_moments` | Token-budget-aware moment fetch | contextReducer.clip() |
| 11 | `apply_diffs` | Atomic field-level edit with rollback | pipeline/executor |
| 12 | `rename_object` | Renames a Query name across all moments | diffService + executor |
| 13 | `verify_story` | Runs all integrity checks | pipeline/verifier |
| 14 | `add_session_note` | Records an agent observation | sessionStore |
| 15 | `save_story` | Writes in-memory story JSON to disk | fs.writeFileSync |
| 16 | `load_sop` | Reads a SOP/training doc, extracts structured context via LLM | workspaceContext (sopContext), sessionStore |
| 17 | `create_story` | Creates a new story from scratch — confirm:false plans, confirm:true generates all moments in parallel | creationService, workspaceContext, sessionStore |
| 18 | `generate_moments` | Generates new moments for an existing loaded story in parallel — returns raw moment array for agent to splice | creationService, workspaceContext, sessionStore |
| 19 | `generate_sfx` | Resolves all `GENERATE_THIS.com` SFX placeholders in a story file into real ElevenLabs audio | sfxService, fs.writeFileSync |
| 20 | `resolve_scene_objects` | Two-step SOP→Unity resolver: extracts nouns (LLM), expands keywords+synonyms, maps to live scene objects via unity_execute_code results, stores confirmedSceneObjects | objectResolverService, workspaceContext |

---

## Startup Sequence

```
1. load_story({ storyId, filePath })          — or load_sop + create_story for new stories
   ├─ fs.readFileSync → storyJson
   ├─ buildRelationshipIndex → momentChain, objectMap, storyContextHeader
   ├─ extractObjectCatalog → ["Dragon", "Sword", ...]
   ├─ buildMerkleTree → hashes all moments
   ├─ indexStoryMoments → upserts to Pinecone with embeddings
   ├─ workspaceContext.setContext → stored in RAM Map
   └─ sessionStore.resume → loads prior changelog

2. load_scene_awareness({ storyId, filePath })   — optional
   ├─ fs.readFileSync → rawText
   ├─ filter objectCatalog for names present in rawText
   └─ workspaceContext.setSceneAwareness → adds to existing Map entry

3. load_sop({ storyId, filePath })               — optional, for creation
   ├─ fs.readFileSync → rawText
   ├─ LLM call → { objectives, procedures, equipment, constraints }
   ├─ workspaceContext.setSopContext → stored in RAM Map
   └─ sessionStore.saveSopContext → persisted to sessions/<storyId>.json

4. get_story_context({ storyId })
   ├─ storyContextHeader + merkleRoot from workspaceContext
   ├─ sessionStore.summarise → last 5 changelog entries
   └─ confirmedSceneObjects from workspaceContext
        → returned as the stable prompt prefix

5. Agent reasons:
   · How many moments are affected? (get_object_map, search_moments)
   · If > 5 or unclear → ask user first
   · Simple field edit? → apply_diffs
   · Structural op? → write a Node script → exec it → verify_story
   · New story? → create_story (confirm:false → review → confirm:true)
   · Add moments to existing? → generate_moments (confirm:false → review → confirm:true) → exec splice script

6. apply_diffs({ storyId, diffs })
   └─ → 6-step atomic pipeline (see below)

7. save_story({ storyId, filePath })
   ├─ workspaceContext.getContext → current storyJson (from RAM)
   └─ fs.writeFileSync → writes to disk
```

---

## Creation Pipeline (`create_story` / `generate_moments`)

```
confirm:false — Planning phase (cheap)
  ├─ getTriggerActionCatalog → reads from actionsService cache (1 HTTP call ever)
  ├─ getSopContext + getSceneAwareness from workspaceContext
  ├─ planStory() → 1 LLM call → structured plan JSON
  │    { storyName, chapters: [{ name, moments: [{ name, userAction, objects, ... }] }] }
  ├─ setPendingPlan → workspaceContext + sessionStore (survives restart)
  └─ return plan for agent review

confirm:true — Generation phase (expensive)
  ├─ getPendingPlan from workspaceContext (or sessionStore fallback)
  ├─ getTriggerActionCatalog → from cache
  ├─ Promise.allSettled([N moment LLM calls simultaneously])
  │    each call: moment spec + full catalog as context (single-turn, no tool calls)
  ├─ retry failed moments up to 3 rounds
  ├─ assembleFinalJson → enforce name + momentIndex from plan
  └─ create_story: writeFileSync → agent calls load_story
     generate_moments: return raw moments array → agent exec splice script → load_story
```

---

## Atomic Apply Pipeline (`executor.applyAtomic`)

```
apply_diffs([diff])
  ↓
Step 1 — Snapshot
  Deep clone { storyJson, relationshipIndex, objectCatalog, merkleTree } into RAM
  If anything below fails → restore this snapshot

Step 2 — Merkle Integrity Check
  Recompute SHA-256 for every moment
  Compare against hashes stored at load_story time
  Mismatch → ABORT (external edit detected, reload required)

Step 3 — Schema Validation
  Each diff's momentGlobalIndex exists in the story?
  All change paths point to real fields?
  New Query names exist in objectCatalog?
  Data field values are valid JSON strings?
  Failure → ABORT with violation list

Step 4 — Apply
  Pure function: returns NEW storyJson, does NOT mutate ctx.storyJson
  Path-based mutation only (parse → mutate → serialize, never string replace)

Step 5 — Post-Apply Assertion (verifier.js)
  4 checks on the new storyJson
  Any failure → restore(snapshot) → ROLLBACK

Step 6 — Update Context + Record Session
  Rebuild relationship index from new storyJson
  Update object catalog
  Incrementally update merkle tree (only changed moments)
  Write all into workspaceContext
  Append to sessions/<storyId>.json on disk
  Return { success: true, changeLog, diffsApplied }
```

---

## Core Services

### `core/workspaceContext.js` — In-Memory Story Store

A Node.js `Map` held in process memory.

```js
_store.get('my-story') = {
  storyJson,
  relationshipIndex,    // momentChain, objectMap, storyContextHeader
  objectCatalog,        // all Query names: ["Dragon", "Sword", ...]
  merkleTree,           // { leaves: [...], root: 'sha256hex' }
  sceneAwareness,       // raw text from load_scene_awareness OR JSON report from resolve_scene_objects
  confirmedSceneObjects,// confirmed Unity object names (set by load_scene_awareness or resolve_scene_objects)
  sopContext,           // { objectives, procedures, equipment, constraints }
  pendingPlan,          // saved plan from create_story/generate_moments confirm:false
  resolverState         // intermediate state between resolve_scene_objects step 1 and step 2
}
```

`snapshot()` — deep clone for atomic rollback. `sopContext`, `pendingPlan`, and `resolverState` are NOT rolled back on `apply_diffs` failure (same rule as `sceneAwareness`).

### `core/sessionStore.js` — Persistent Session Memory

JSON file per story at `sessions/<storyId>.json`. Survives MCP server restarts.

```json
{
  "storyId": "my-story",
  "createdAt": "...",
  "changelog": [{ "ts": "...", "diffsApplied": 2, "changeLog": "M5: Updated VO" }],
  "notes": [{ "ts": "...", "text": "..." }],
  "sopContext": { "objectives": [], "procedures": [], "equipment": [], "constraints": "" },
  "pendingPlan": { "storyName": "...", "chapters": [...] }
}
```

### `integrity/merkleTree.js` — Out-of-Band Edit Detection

Detects if someone manually edited the story file between sessions.

```
moment[0] JSON  →  sha256()  →  hash_0  ─┐
moment[1] JSON  →  sha256()  →  hash_1  ─┼→ sha256(hash_0+hash_1+hash_2) → root
moment[2] JSON  →  sha256()  →  hash_2  ─┘
```

### `pipeline/verifier.js` — 4 Post-Apply Assertions

1. `momentIndex` sequence — `chapter[i].moments[j].momentIndex === j`
2. `.Data` fields are valid JSON
3. No empty Query names
4. `triggerActionSets` structure — every entry must have a `trigger` object

### `core/contextReducer.js` — Token Budget

`clip(momentChain, query, maxMoments=5)` — scores moments by keyword overlap, returns top N + ±1 neighbours. Prevents sending all 200 moments to the LLM.

### `services/actionsService.js` — Infinity Workshop Catalog Cache

Fetches action + trigger types from Infinity Workshop API once per process lifetime. All 20 tools and the creation pipeline read from `_cache` — no repeated HTTP calls.

### `services/creationService.js` — Story Creation Engine

- `planStory()` — 1 LLM call → structured plan JSON
- `generateMoment()` — 1 single-turn LLM call per moment (catalog pre-injected as context)
- `generateAllMoments()` — `Promise.allSettled` with 3-round retry
- `assembleFinalJson()` — enforces `name` + `momentIndex` from plan

### `services/sopService.js` — SOP Context Extraction

One LLM call to extract `{ objectives, procedures, equipment, constraints }` from raw SOP text.

### `services/llmClient.js` — LLM HTTP Client

Thin axios wrapper over OpenRouter `/v1/chat/completions`. Uses `ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_BASE_URL` from `.env`.

---

## Key Design Principles

| Principle | Where enforced |
|-----------|---------------|
| **Parse → Mutate → Serialize** | `diffService.applyDiffs()` — operates on parsed JSON, never string replace |
| **Atomic apply with rollback** | `executor.applyAtomic()` — snapshot → try → restore on fail |
| **Token budget** | `contextReducer.clip()` — max 5 relevant moments to LLM |
| **Out-of-band edit detection** | `merkleTree.verifyTree()` — catches manual file edits before apply |
| **Resumable sessions** | `sessionStore` — persists to `sessions/<storyId>.json` |
| **No hardcoded pipeline** | Orchestrator picks tools per problem, writes code when tools aren't enough |
| **Catalog cached once** | `actionsService._cache` — Infinity Workshop fetched once per server process |
| **Creation uses parallel gen** | `generateAllMoments` — all moment LLM calls simultaneous via `Promise.allSettled` |
| **Plan persisted before generation** | `pendingPlan` in workspaceContext + sessionStore — survives MCP restart between confirm:false and confirm:true |
| **Scene-type-aware discovery** | `resolve_scene_objects` detects standard vs non-standard Unity scenes, skips broken calls on EAF-type scenes |
| **Object resolver is stateful** | `resolverState` in workspaceContext bridges step 1 and step 2 of `resolve_scene_objects` without requiring the agent to pass large JSON back |

---

## Scene Object Resolver

Solves the core hallucination problem: SOP terms use human language ("shroud manipulator arm"), Unity uses PascalCase names (`Shroud_Ladle`). Without a resolver, `create_story` invents Query names that don't exist in the scene.

### Problem

The old 4-step discovery flow (`unity_vrse_query_objects_list` + `unity_scene_hierarchy(parentPath="QueryObjects/...")`) fails on non-standard scenes like EAF:
- EAF has no `QueryObjectsIdManager` → `unity_vrse_query_objects_list` errors
- EAF uses `#h2  Interactables` root layout → hardcoded `QueryObjects/` paths don't exist

### Solution: Two-Step Resolver

```
AGENT                              resolve_scene_objects tool         Unity Editor
  │                                        │                              │
  │  load_sop(filePath)                    │                              │
  │─────────────────────────────────────▶ sopContext stored              │
  │                                        │                              │
  │  unity_scene_hierarchy(maxDepth=1)    │                              │
  │──────────────────────────────────────────────────────────────────▶  │
  │  ◀── root object names (67 names) ────────────────────────────────── │
  │                                        │                              │
  │  resolve_scene_objects(sceneCatalog)  │                              │
  │─────────────────────────────────────▶ │                              │
  │                                        │ extractSopNouns (LLM)        │
  │                                        │ generateSynonyms (LLM x N)  │
  │                                        │ build mega keyword list      │
  │                                        │ store nounGroups in          │
  │                                        │   workspaceContext           │
  │  ◀─ batchSearchCode (C#) ─────────────│                              │
  │                                        │                              │
  │  unity_execute_code(batchSearchCode)  │                              │
  │──────────────────────────────────────────────────────────────────▶  │
  │  ◀── matched objects (name, path, childCount) ─────────────────────  │
  │                                        │                              │
  │  resolve_scene_objects(batchResultsJson) [+ optional subtreeResultsJson]
  │─────────────────────────────────────▶ │                              │
  │                                        │ map hits → nouns            │
  │                                        │ LLM child mapping           │
  │                                        │ attempt 3 catalog match      │
  │                                        │ store confirmedSceneObjects  │
  │  ◀─ RESOLVED / AMBIGUOUS / NOT_IN_SCENE report ───────────────────── │
  │                                        │                              │
  │  (if pendingSubtrees returned:         │                              │
  │   run unity_execute_code per subtree   │                              │
  │   then re-call step 2 with results)    │                              │
```

### Three-Attempt Resolution

| Attempt | Input | Unity calls | LLM calls |
|---------|-------|------------|-----------|
| 1 | SOP nouns → sub-word + synonym keywords | 1 batch search | 1 noun extraction + N synonym generations |
| 1b (subtrees) | Hit objects with SOP children | 1 per parent hit | 1 child mapping per parent |
| 3 | Unresolved nouns | 0 | 1 per noun (reads scene catalog) |

*Attempt 2 (synonym search) is folded into Attempt 1 — synonyms are generated upfront and included in the single batch search, minimising Unity MCP calls.*

### MCP Call Budget

```
unity_select_instance           — 1 (always)
unity_scene_info                — 1 (always)
unity_scene_hierarchy (root)    — 1 (always, maxDepth=1 maxNodes=200)
unity_execute_code batch search — 1 (all nouns + synonyms in one call)
unity_execute_code subtree walk — 1 per parent hit with SOP children (typically 2–5)

Typical total:  6–10 Unity calls per SOP
Worst case:     ~15 calls
```

### Output Report

```json
{
  "RESOLVED":      [{ "sopTerm": "shroud manipulator arm", "queryName": "Shroud_Ladle", "path": "EAF/.../Shroud_Ladle", "resolvedAtAttempt": 1 }],
  "PARTIAL_MATCH": [{ "sopTerm": "...", "queryName": "...", "note": "inactive or on NPC rig" }],
  "AMBIGUOUS":     [{ "sopTerm": "...", "candidates": ["A", "B"], "note": "human confirmation needed" }],
  "NOT_IN_SCENE":  [{ "sopTerm": "...", "note": "no match after 3 attempts" }]
}
```

`RESOLVED` entries are stored in `workspaceContext.confirmedSceneObjects`. `get_story_context` returns them as `confirmedSceneObjects`. `create_story` reads them when generating the story, ensuring zero hallucinated Query names.

### Key Files

| File | Role |
|------|------|
| `services/objectResolverService.js` | All LLM calls: noun extraction, synonym generation, child mapping, catalog matching. Pure functions — no Unity calls, fully testable. |
| `mcp-server/index.js` tool 20 | Tool handler: guards (sopContext required), manages step 1/2 state, stores results. |
| `core/workspaceContext.js` | `setResolverState` / `getResolverState` — bridges the two tool calls. |

