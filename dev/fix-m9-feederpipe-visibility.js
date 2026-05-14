// Make the FeederPipesPlacePoint actually visible during M9.
// Both M9 and M10 use the same hide-then-Edit-outline pattern, but only M9's
// placepoint is invisible in-game — almost certainly because the FeederPipesPlacePoint
// scene object has no clean renderer for the outline to draw on.
//
// Two-pronged fix:
// 1. Drop the M9.onAwake SetActive that hides Outline/Label/Highlighter to false.
//    Let the placepoint inherit its scene-default visibility instead.
// 2. In M9.onStart, explicitly turn on the Highlighter (system highlighter material)
//    AND enable a TargetGuidanceArrowAction pointing at the placepoint. The arrow
//    is independent of the outline shader, so even if the outline silently fails
//    the player still gets a visible cue.
// 3. In M9.onRight (CorrectPlace) and M9.onWrong reset, also disable the arrow.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

const m9 = story.chapters[2].moments[2];
if (!m9 || !/Feeder Pipe/i.test(m9.name)) {
  throw new Error('M9 lookup failed');
}

// 1. Drop the hide-everything SetActive in onAwake.
const beforeAwake = m9.onAwake.actions.length;
m9.onAwake.actions = m9.onAwake.actions.filter(a => {
  return !(
    a.Name === 'MetaLayerAction' &&
    a.Option === 'SetActive' &&
    a.Query === 'FeederPipesPlacePoint'
  );
});
const removedAwakeHide = beforeAwake - m9.onAwake.actions.length;

// 2a. Force Highlighter on the placepoint with explicit material — match the
//     onLastWarning escalation that has been shown to work.
m9.onStart.actions.push({
  Query: 'FeederPipesPlacePoint',
  Name: 'MetaLayerAction',
  Option: 'Edit',
  Data: '{"Highlighter":{"setActive":true,"material":"Materials/_ObjectHighligherMaterial_"}}',
});

// 2b. Enable a guidance arrow pointing at the placepoint.
m9.onStart.actions.push({
  Query: 'FeederPipesPlacePoint',
  Name: 'TargetGuidanceArrowAction',
  Option: 'Enable',
  Data: '{"waitForCompletion":false}',
});

// 3. In onRight CorrectPlace actions, disable the arrow so it doesn't linger.
const correct = (m9.onRight.triggerActionSets || []).find(
  t => t && t.trigger && t.trigger.Name === 'PlacePointTrigger' && t.trigger.Option === 'CorrectPlace'
);
if (correct) {
  correct.actions = correct.actions || [];
  correct.actions.push({
    Query: 'FeederPipesPlacePoint',
    Name: 'TargetGuidanceArrowAction',
    Option: 'Disable',
    Data: '{"waitForCompletion":false}',
  });
}

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({
  removedAwakeHide,
  addedHighlighterEdit: true,
  addedGuidanceArrow: true,
  addedDisableArrowOnCorrect: !!correct,
}, null, 2));
