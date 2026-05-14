require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const axios = require('axios')

let _cache = null

async function getTriggerActionCatalog(type = 'all') {
  if (!_cache) {
    const actionsUrl  = process.env.INFINITY_WORKSHOP_ACTIONS_URL
    const triggersUrl = process.env.INFINITY_WORKSHOP_TRIGGERS_URL

    if (!actionsUrl || !triggersUrl) {
      throw new Error(
        'INFINITY_WORKSHOP_ACTIONS_URL and INFINITY_WORKSHOP_TRIGGERS_URL must be set in .env'
      )
    }

    const [actionsRes, triggersRes] = await Promise.all([
      axios.get(actionsUrl),
      axios.get(triggersUrl)
    ])

    _cache = {
      actions:   actionsRes.data,
      triggers:  triggersRes.data,
      fetchedAt: Date.now()
    }
  }

  if (type === 'actions')  return { actions:  _cache.actions,  fetchedAt: _cache.fetchedAt }
  if (type === 'triggers') return { triggers: _cache.triggers, fetchedAt: _cache.fetchedAt }
  return _cache
}

module.exports = { getTriggerActionCatalog }
