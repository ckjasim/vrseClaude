const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../stories/chromatica.json');
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Helper: walk all actions in a moment section and replace Query values
function replaceQuery(actions, from, to) {
  if (!Array.isArray(actions)) return;
  for (const a of actions) {
    if (a.Query === from) a.Query = to;
  }
}

function fixMoment(moment) {
  const sections = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning'];
  for (const sec of sections) {
    if (moment[sec]?.actions) replaceQuery(moment[sec].actions, 'TargetArrow1', 'Arrows');
    if (moment[sec]?.actions) replaceQuery(moment[sec].actions, 'Island2Environment', 'Island_2');
  }
  if (moment.onRight?.triggerActionSets) {
    for (const tas of moment.onRight.triggerActionSets) {
      if (tas.trigger?.Query === 'TargetArrow1') tas.trigger.Query = 'Arrows';
      if (tas.trigger?.Query === 'Island2Environment') tas.trigger.Query = 'Island_2';
      replaceQuery(tas.actions, 'TargetArrow1', 'Arrows');
      replaceQuery(tas.actions, 'Island2Environment', 'Island_2');
    }
  }
}

// Fix TargetArrow1 -> Arrows and Island2Environment -> Island_2 across all moments
let totalMoments = 0;
for (const chapter of story.chapters) {
  for (const moment of chapter.moments) {
    fixMoment(moment);
    totalMoments++;
  }
}
console.log(`Replaced TargetArrow1->Arrows and Island2Environment->Island_2 across ${totalMoments} moments`);

// Fix M4 (The Sleeping Gears, chapterIndex=1, localIndex=0):
// Remove CountDownTimer actions from onRight.triggerActionSets[1].actions
const m4 = story.chapters[1].moments[0];
const releaseActions = m4.onRight?.triggerActionSets?.[1]?.actions;
if (releaseActions) {
  const before = releaseActions.length;
  m4.onRight.triggerActionSets[1].actions = releaseActions.filter(
    a => a.Query !== 'CountDownTimer'
  );
  const after = m4.onRight.triggerActionSets[1].actions.length;
  console.log(`M4 CountDownTimer actions removed: ${before - after} (${before} -> ${after} actions)`);
} else {
  console.log('M4: no releaseActions found to filter');
}

// Also remove CountDownTimer from any other moment it appears in
for (const chapter of story.chapters) {
  for (const moment of chapter.moments) {
    for (const sec of ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning']) {
      if (moment[sec]?.actions) {
        const before = moment[sec].actions.length;
        moment[sec].actions = moment[sec].actions.filter(a => a.Query !== 'CountDownTimer');
        if (moment[sec].actions.length !== before) {
          console.log(`Removed CountDownTimer from ${moment.name}.${sec}`);
        }
      }
    }
    if (moment.onRight?.triggerActionSets) {
      for (const tas of moment.onRight.triggerActionSets) {
        const before = tas.actions.length;
        tas.actions = tas.actions.filter(a => a.Query !== 'CountDownTimer');
        if (tas.actions.length !== before) {
          console.log(`Removed CountDownTimer from ${moment.name}.onRight trigger actions`);
        }
      }
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
console.log('Done. Story written back to', filePath);
