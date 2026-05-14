// Two targeted fixes:
// 1. Remove duplicate AmbientFactoryHum PlayLoop at chapters[3].moments[0].onStart (M12).
//    The one at M0 onAwake is already running — this second loop layers on top.
// 2. Remove the Objects/Despawn for Trolley_Cart 1A at chapters[0].moments[2].onAwake (M2).
//    Leftover from when M2 had a "trolley arrival" beat. Now that we spawn the trolley
//    at M0 and never re-spawn it, the despawn at M2 was making it vanish forever.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

let ambientRemoved = 0;
let trolleyDespawnRemoved = 0;

// 1. Duplicate ambient
const m12 = story.chapters[3].moments[0];
if (m12 && m12.onStart && Array.isArray(m12.onStart.actions)) {
  const before = m12.onStart.actions.length;
  m12.onStart.actions = m12.onStart.actions.filter(a => {
    if ((a.Name === 'SFXPlayer' || a.Query === 'SFXPlayer') && a.Option === 'PlayLoop') {
      try {
        const d = JSON.parse(a.Data || '{}');
        if (d.audioClipName === 'AmbientFactoryHum') return false;
      } catch (e) {}
    }
    return true;
  });
  ambientRemoved = before - m12.onStart.actions.length;
}

// 2. Trolley despawn
const m2 = story.chapters[0].moments[2];
if (m2 && m2.onAwake && Array.isArray(m2.onAwake.actions)) {
  const before = m2.onAwake.actions.length;
  m2.onAwake.actions = m2.onAwake.actions.filter(a => {
    return !(a.Name === 'Objects' && a.Option === 'Despawn' && a.Query === 'Trolley_Cart 1A');
  });
  trolleyDespawnRemoved = before - m2.onAwake.actions.length;
}

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({ ambientRemoved, trolleyDespawnRemoved }, null, 2));
