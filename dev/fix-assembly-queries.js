// Surgical rewrite of invented Query values in Assembly_Training.json.
// - "Cooling Roller (with space)" -> "Cooling Roller"
// - "Trolley_Cart"                 -> "Trolley_Cart 1A"
// - "Player" / "ToastMessage" / "TargetArrow" / "ToastPanel" -> "VOPlayer"
//   (these were narration/FX slots; redirecting to VOPlayer keeps them valid
//    and won't fire an unintended scene object.)
//
// Runs parse -> mutate -> serialize. No string replacement.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';

const RENAMES = {
  'Cooling Roller (with space)': 'Cooling Roller',
  'Trolley_Cart': 'Trolley_Cart 1A',
  'Player': 'VOPlayer',
  'ToastMessage': 'VOPlayer',
  'TargetArrow': 'VOPlayer',
  'ToastPanel': 'VOPlayer',
};

const story = JSON.parse(fs.readFileSync(path, 'utf8'));

let queryTouches = 0;
let catalogTouches = 0;

function fixQuery(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { obj.forEach(fixQuery); return; }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k === 'Query' && typeof v === 'string' && RENAMES[v]) {
      obj[k] = RENAMES[v];
      queryTouches++;
    } else if (v && typeof v === 'object') {
      fixQuery(v);
    }
  }
}

fixQuery(story);

// Also update the story's embedded sceneObjectCatalog if present, so validators accept the rewrites.
function fixCatalog(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && RENAMES[obj[i]] !== undefined) {
        obj[i] = RENAMES[obj[i]];
        catalogTouches++;
      } else if (obj[i] && typeof obj[i] === 'object') {
        fixCatalog(obj[i]);
      }
    }
    return;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && RENAMES[v] !== undefined && (k === 'name' || k === 'Name' || k === 'queryName')) {
      // leave user-visible names alone; only catalog arrays get rewritten above
    } else if (v && typeof v === 'object') {
      fixCatalog(v);
    }
  }
}

fixCatalog(story);

// De-dupe catalog arrays if any exist at top-level
function dedupeStringArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set();
  return arr.filter(x => {
    if (typeof x !== 'string') return true;
    if (seen.has(x)) return false;
    seen.add(x);
    return true;
  });
}

if (Array.isArray(story.sceneObjectCatalog)) {
  story.sceneObjectCatalog = dedupeStringArray(story.sceneObjectCatalog);
}
if (Array.isArray(story.objectCatalog)) {
  story.objectCatalog = dedupeStringArray(story.objectCatalog);
}

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({ queryTouches, catalogTouches }, null, 2));
