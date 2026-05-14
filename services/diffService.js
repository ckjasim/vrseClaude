/**
 * Pass 4: Validate diffs against schema rules.
 * Pure code — no LLM.
 */
function validateDiffs({ allDiffs, storyJson, momentChain, objectCatalog }) {
  const violations = []
  const objectSet = new Set(objectCatalog)

  for (const diff of allDiffs) {
    for (const change of diff.changes || []) {
      if (change.path?.includes('.Query') && change.operation === 'replace') {
        if (!objectSet.has(change.value)) {
          violations.push({
            type: 'INVALID_QUERY',
            momentGlobalIndex: diff.momentGlobalIndex,
            path: change.path,
            value: change.value,
            message: `Query "${change.value}" not found in scene object catalog`
          })
        }
      }

      if (change.path?.includes('.Data') && change.operation === 'replace') {
        try {
          JSON.parse(change.value)
        } catch {
          violations.push({
            type: 'INVALID_DATA_JSON',
            momentGlobalIndex: diff.momentGlobalIndex,
            path: change.path,
            message: `Data field is not valid JSON: ${change.value?.substring(0, 60)}`
          })
        }
      }
    }
  }

  return { valid: violations.length === 0, violations }
}

/**
 * Apply diffs to a deep clone of storyJson.
 * Recalculates momentIndex after any add/delete operations.
 */
function applyDiffs({ allDiffs, storyJson, momentChain }) {
  const modified = JSON.parse(JSON.stringify(storyJson))

  for (const diff of allDiffs) {
    const entry = momentChain[diff.momentGlobalIndex]
    if (!entry) continue

    const moment = modified.chapters[entry.chapterIndex]?.moments[entry.localIndex]
    if (!moment) continue

    const sorted = [...diff.changes].sort((a, b) => {
      if (a.operation === 'delete' && b.operation !== 'delete') return 1
      if (a.operation !== 'delete' && b.operation === 'delete') return -1
      return 0
    })

    for (const change of sorted) {
      applyChange(moment, change)
    }
  }

  for (const chapter of modified.chapters) {
    chapter.moments.forEach((m, i) => { m.momentIndex = i })
  }

  return modified
}

/**
 * Handle rename operations — pure code, no LLM.
 */
function handleRename(editPlan, storyJson, momentChain) {
  const { renameFrom, renameTo, targetMoments } = editPlan
  const diffs = []

  for (const targetMeta of targetMoments) {
    const moment = storyJson.chapters[targetMeta.chapterIndex]?.moments[targetMeta.localIndex]
    if (!moment) continue

    const changes = findAndBuildRenameChanges(moment, renameFrom, renameTo)
    if (changes.length > 0) {
      diffs.push({
        momentGlobalIndex: targetMeta.globalIndex,
        changes,
        changeLog: `Renamed Query "${renameFrom}" to "${renameTo}" in ${changes.length} node(s)`
      })
    }
  }

  return { diffs, sfxAdded: false }
}

function findAndBuildRenameChanges(momentJson, fromName, toName) {
  const changes = []
  const eventBlocks = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning']

  for (const block of eventBlocks) {
    const actions = momentJson[block]?.actions || []
    actions.forEach((action, i) => {
      if (action.Query === fromName) {
        changes.push({ path: `${block}.actions[${i}].Query`, operation: 'replace', value: toName })
      }
    })
  }

  for (const [setIdx, set] of (momentJson.onRight?.triggerActionSets || []).entries()) {
    if (set.trigger?.Query === fromName) {
      changes.push({
        path: `onRight.triggerActionSets[${setIdx}].trigger.Query`,
        operation: 'replace',
        value: toName
      })
    }
    set.actions?.forEach((action, i) => {
      if (action.Query === fromName) {
        changes.push({
          path: `onRight.triggerActionSets[${setIdx}].actions[${i}].Query`,
          operation: 'replace',
          value: toName
        })
      }
    })
  }

  return changes
}

function applyChange(obj, change) {
  const { path, operation, value, index } = change

  if (operation === 'replace') {
    setValueAtPath(obj, path, value)
  } else if (operation === 'insert') {
    const arr = getValueAtPath(obj, path)
    if (Array.isArray(arr)) {
      arr.splice(index !== undefined ? index : arr.length, 0, value)
    }
  } else if (operation === 'delete') {
    const lastDot = path.lastIndexOf('.')
    const lastBracket = path.lastIndexOf('[')
    if (lastBracket > lastDot) {
      const arrPath = path.substring(0, lastBracket)
      const idx = parseInt(path.substring(lastBracket + 1))
      const arr = getValueAtPath(obj, arrPath)
      if (Array.isArray(arr)) arr.splice(idx, 1)
    } else {
      const parentPath = path.substring(0, lastDot)
      const key = path.substring(lastDot + 1)
      const parent = getValueAtPath(obj, parentPath)
      if (parent) delete parent[key]
    }
  }
}

function setValueAtPath(obj, path, value) {
  const parts = parsePath(path)
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]]
    if (current === undefined) return
  }
  current[parts[parts.length - 1]] = value
}

function getValueAtPath(obj, path) {
  return parsePath(path).reduce((acc, key) => acc?.[key], obj)
}

function parsePath(path) {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
}

module.exports = { validateDiffs, applyDiffs, handleRename, getValueAtPath }
