/**
 * Verifier — post-apply assertions.
 *
 * Runs after executor.applyAtomic() succeeds on the modified storyJson.
 * Any assertion failure triggers a rollback in the executor.
 */
const { collectAllActions } = require('../services/indexService')

/**
 * Run all assertions on a modified story.
 * @param {object} storyJson  - the result of applyDiffs
 * @returns {{ valid: boolean, violations: object[] }}
 */
function assertStory(storyJson) {
  const violations = []

  assertMomentIndexSequence(storyJson, violations)
  assertDataJsonValidity(storyJson, violations)
  assertNoEmptyQueryNames(storyJson, violations)
  assertTriggerActionSetsStructure(storyJson, violations)

  return { valid: violations.length === 0, violations }
}

/**
 * momentIndex must equal the array position within each chapter.
 */
function assertMomentIndexSequence(storyJson, violations) {
  for (const [ci, chapter] of storyJson.chapters.entries()) {
    for (const [mi, moment] of chapter.moments.entries()) {
      if (moment.momentIndex !== mi) {
        violations.push({
          type:    'MOMENT_INDEX_MISMATCH',
          chapter: ci,
          local:   mi,
          name:    moment.name,
          message: `momentIndex is ${moment.momentIndex}, expected ${mi}`
        })
      }
    }
  }
}

/**
 * Every .Data field must be valid JSON.
 */
function assertDataJsonValidity(storyJson, violations) {
  for (const [ci, chapter] of storyJson.chapters.entries()) {
    for (const [mi, moment] of chapter.moments.entries()) {
      const actions = collectAllActions(moment)
      for (const [ai, action] of actions.entries()) {
        if (action.Data && typeof action.Data === 'string') {
          try {
            JSON.parse(action.Data)
          } catch {
            violations.push({
              type:    'INVALID_DATA_JSON',
              chapter: ci,
              local:   mi,
              name:    moment.name,
              actionIndex: ai,
              actionName:  action.Name,
              fragment:    action.Data.substring(0, 60)
            })
          }
        }
      }
    }
  }
}

/**
 * No action or trigger should have an empty/null Query.
 */
function assertNoEmptyQueryNames(storyJson, violations) {
  for (const [ci, chapter] of storyJson.chapters.entries()) {
    for (const [mi, moment] of chapter.moments.entries()) {
      const actions = collectAllActions(moment)
      for (const action of actions) {
        if (action.Query === '' || action.Query === null || action.Query === undefined) {
          violations.push({
            type:    'EMPTY_QUERY',
            chapter: ci,
            local:   mi,
            name:    moment.name,
            action:  action.Name,
            message: 'Action has empty or null Query'
          })
        }
      }
      for (const set of moment.onRight?.triggerActionSets || []) {
        if (set.trigger && (set.trigger.Query === '' || set.trigger.Query === null || set.trigger.Query === undefined)) {
          violations.push({
            type:    'EMPTY_TRIGGER_QUERY',
            chapter: ci,
            local:   mi,
            name:    moment.name,
            message: 'Trigger has empty or null Query'
          })
        }
      }
    }
  }
}

/**
 * Each triggerActionSet must have a trigger object.
 */
function assertTriggerActionSetsStructure(storyJson, violations) {
  for (const [ci, chapter] of storyJson.chapters.entries()) {
    for (const [mi, moment] of chapter.moments.entries()) {
      for (const [si, set] of (moment.onRight?.triggerActionSets || []).entries()) {
        if (!set.trigger) {
          violations.push({
            type:    'MISSING_TRIGGER',
            chapter: ci,
            local:   mi,
            name:    moment.name,
            setIdx:  si,
            message: `triggerActionSets[${si}] is missing a trigger`
          })
        }
      }
    }
  }
}

module.exports = { assertStory }
