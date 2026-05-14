/**
 * migrate-to-pascal.js
 * Walks every action and trigger in a VrseBuilder story JSON and renames
 * the four interaction field names from lowercase to PascalCase:
 *   query → Query
 *   name  → Name
 *   option → Option
 *   data  → Data
 *
 * Usage: node dev/migrate-to-pascal.js <path-to-story.json>
 */

const fs   = require('fs')
const path = require('path')

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node dev/migrate-to-pascal.js <path-to-story.json>')
  process.exit(1)
}

const abs = path.resolve(filePath)
const story = JSON.parse(fs.readFileSync(abs, 'utf-8'))

let converted = 0

function convertObj(obj) {
  if (!obj || typeof obj !== 'object') return obj

  // Schema C: nested "action" wrapper — flatten it, then fall through
  // e.g. { query: "X", action: { Name: "Y", Option: "Z", Data: "..." } }
  if ('action' in obj && obj.action && typeof obj.action === 'object') {
    const inner = obj.action
    if (!obj.Name   && inner.Name)   obj.Name   = inner.Name
    if (!obj.Option && inner.Option) obj.Option = inner.Option
    if (!obj.Data   && inner.Data)   obj.Data   = inner.Data
    delete obj.action
    converted++
  }

  // Schema B: actionName / actionOption / triggerName / triggerOption
  if ('actionName'   in obj) { obj.Name   = obj.actionName;   delete obj.actionName   }
  if ('actionOption' in obj) { obj.Option = obj.actionOption; delete obj.actionOption }
  if ('triggerName'  in obj) { obj.Name   = obj.triggerName;  delete obj.triggerName  }
  if ('triggerOption'in obj) { obj.Option = obj.triggerOption;delete obj.triggerOption }

  // Standard lowercase → PascalCase
  const hasLower = 'query' in obj || 'name' in obj || 'option' in obj || 'data' in obj
  if (hasLower) {
    if ('query'  in obj) { obj.Query  = obj.query;  delete obj.query  }
    if ('name'   in obj) { obj.Name   = obj.name;   delete obj.name   }
    if ('option' in obj) { obj.Option = obj.option; delete obj.option }
    if ('data'   in obj) { obj.Data   = obj.data;   delete obj.data   }
    converted++
  }

  return obj
}

function walkActions(actions) {
  if (!Array.isArray(actions)) return
  actions.forEach(a => convertObj(a))
}

function walkTriggerActionSets(sets) {
  if (!Array.isArray(sets)) return
  sets.forEach(set => {
    if (set.trigger) convertObj(set.trigger)
    walkActions(set.actions)
  })
}

function walkMoment(moment) {
  const simpleBlocks = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning']
  for (const block of simpleBlocks) {
    if (moment[block]?.actions) walkActions(moment[block].actions)
  }
  if (moment.onRight?.triggerActionSets) {
    walkTriggerActionSets(moment.onRight.triggerActionSets)
  }
  if (Array.isArray(moment.onWrong)) {
    moment.onWrong.forEach(item => {
      if (item.actions) walkActions(item.actions)
      if (item.trigger) convertObj(item.trigger)
    })
  }
}

for (const chapter of story.chapters || []) {
  for (const moment of chapter.moments || []) {
    walkMoment(moment)
  }
}

fs.writeFileSync(abs, JSON.stringify(story, null, 2), 'utf-8')
console.log(`Done. Converted ${converted} action/trigger objects in ${abs}`)
