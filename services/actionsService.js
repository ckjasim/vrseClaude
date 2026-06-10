require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const axios = require('axios')

const BASIC_ACTIONS = [
  'VoiceOver',
  'SFXPlayer',
  'MetaLayerAction',
  'TextMediaAction',
  'ImageMediaAction',
  'HapticsAction',
  'Objects',
  'Player',
  'TimerAction',
]

const BASIC_TRIGGERS = ['HandTouchTrigger', 'GrabbableTrigger', 'PlacePointTrigger']

// Keyed by mode so both can coexist in the same session without poisoning each other
const _cache = {}

async function getTriggerActionCatalog(type = 'all', mode = 'goWild') {
  if (!_cache[mode]) {
    if (mode === 'basic') {
      const actionsBatchUrl  = process.env.INFINITY_WORKSHOP_ACTIONS_BATCH_URL
      const triggersBatchUrl = process.env.INFINITY_WORKSHOP_TRIGGERS_BATCH_URL

      if (!actionsBatchUrl || !triggersBatchUrl) {
        throw new Error(
          'INFINITY_WORKSHOP_ACTIONS_BATCH_URL and INFINITY_WORKSHOP_TRIGGERS_BATCH_URL must be set in .env'
        )
      }

      const [actionsRes, triggersRes] = await Promise.all([
        axios.post(actionsBatchUrl,  { names: BASIC_ACTIONS }),
        axios.post(triggersBatchUrl, { names: BASIC_TRIGGERS }),
      ])

      _cache[mode] = {
        actions:   actionsRes.data,
        triggers:  triggersRes.data,
        fetchedAt: Date.now(),
      }
    } else {
      const actionsUrl  = process.env.INFINITY_WORKSHOP_ACTIONS_URL
      const triggersUrl = process.env.INFINITY_WORKSHOP_TRIGGERS_URL

      if (!actionsUrl || !triggersUrl) {
        throw new Error(
          'INFINITY_WORKSHOP_ACTIONS_URL and INFINITY_WORKSHOP_TRIGGERS_URL must be set in .env'
        )
      }

      const [actionsRes, triggersRes] = await Promise.all([
        axios.get(actionsUrl),
        axios.get(triggersUrl),
      ])

      _cache[mode] = {
        actions:   actionsRes.data,
        triggers:  triggersRes.data,
        fetchedAt: Date.now(),
      }
    }
  }

  const entry = _cache[mode]
  if (type === 'actions')  return { actions:  entry.actions,  fetchedAt: entry.fetchedAt }
  if (type === 'triggers') return { triggers: entry.triggers, fetchedAt: entry.fetchedAt }
  return entry
}

module.exports = { getTriggerActionCatalog }
