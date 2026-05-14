/**
 * Component 5 — Transcripts, Memory, and Resumption
 * Persists edit sessions to sessions/<storyId>.json so they survive
 * gateway restarts. Agents call record() after each apply_diffs,
 * note() for free-form observations, and resume() on load_story.
 */
const fs   = require('fs')
const path = require('path')
const { SESSIONS_DIR } = require('../config/constants')

function _sessionPath(storyId) {
  return path.join(SESSIONS_DIR, `${storyId}.json`)
}

function _ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

function _load(storyId) {
  const p = _sessionPath(storyId)
  if (!fs.existsSync(p)) return _empty(storyId)
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) }
  catch { return _empty(storyId) }
}

function _save(storyId, session) {
  _ensureDir()
  fs.writeFileSync(_sessionPath(storyId), JSON.stringify(session, null, 2), 'utf-8')
}

function _empty(storyId) {
  return {
    storyId,
    createdAt:   new Date().toISOString(),
    changelog:   [],
    notes:       [],
    sopContext:  null,
    pendingPlan: null
  }
}

/**
 * Append a change log entry (called after successful apply_diffs).
 */
function record(storyId, changeLog, diffsApplied = 0) {
  const session = _load(storyId)
  session.changelog.push({
    ts: new Date().toISOString(),
    diffsApplied,
    changeLog
  })
  _save(storyId, session)
}

/**
 * Store a free-form agent note (observations, warnings, decisions).
 */
function note(storyId, text) {
  const session = _load(storyId)
  session.notes.push({ ts: new Date().toISOString(), text })
  _save(storyId, session)
}

/**
 * Load session state for display or context injection on load_story.
 */
function resume(storyId) {
  return _load(storyId)
}

/**
 * Wipe the session (called after save_story if user wants a clean slate).
 */
function reset(storyId) {
  _save(storyId, _empty(storyId))
}

/**
 * Persist SOP context to disk. Survives gateway restarts.
 */
function saveSopContext(storyId, sopContext) {
  const session = _load(storyId)
  session.sopContext = sopContext
  _save(storyId, session)
}

function loadSopContext(storyId) {
  return _load(storyId).sopContext || null
}

/**
 * Persist the pending story plan (from create_story confirm:false).
 * Survives gateway restarts — plan is recovered for confirm:true without replanning.
 */
function savePendingPlan(storyId, plan) {
  const session = _load(storyId)
  session.pendingPlan = plan
  _save(storyId, session)
}

function loadPendingPlan(storyId) {
  return _load(storyId).pendingPlan || null
}

/**
 * Summarise the session as a compact string for prompt injection.
 * Keeps the token cost low — only last N entries.
 */
function summarise(storyId, lastN = 5) {
  const session = _load(storyId)
  const recentChanges = session.changelog.slice(-lastN)
  const lines = recentChanges.map(e => `[${e.ts.slice(0, 16)}] ${e.changeLog}`)
  if (session.notes.length) lines.push('Notes: ' + session.notes.slice(-3).map(n => n.text).join(' | '))
  return lines.join('\n') || 'No prior edits in this session.'
}

module.exports = {
  record, note, resume, reset, summarise,
  saveSopContext, loadSopContext,
  savePendingPlan, loadPendingPlan
}
