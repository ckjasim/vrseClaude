// Apply four fixes to Assembly_Training.json in one parse → mutate → serialize pass.
//
// 1. Hoist every Objects/Spawn for grabbables, trolleys, and placepoints into M0.onAwake.
//    Removes the pop-in effect mid-story.
// 2. Lower AmbientFactoryHum volume to 0.15 in M0.onAwake. Keep it as the only ambient.
// 3. Strip non-essential SFX clips (chimes, transition stings, duplicate ambient).
//    Also drop every SFXPlayer/StopAndSkip — they were killing the ambient between moments.
// 4. Rewrite M7 (Position Shift Feeder Shaking Tray) into a no-interaction
//    timer + ObjectAnimationAction auto-place sequence.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

// ----- config -----
const HOIST_TARGETS = new Set([
  // grabbables
  'Shift Feeder Base',
  'Shift Feeder Base Cover',
  'ShiftFeederBaseCombined',
  'Shift Feeder Tube Assembly',
  'Shift Feeder Feeding Chute',
  'Shift Feeder Shaking Tray',
  'Feeder Pipe',
  'Dancing Roller',
  'Skimming Assembly',
  'Clamps_1',
  'Clamps_2',
  // placepoints
  'ShiftFeederBottomPlacePoint',
  'ShiftFeederUpperCoverPlacePoint',
  'ShiftFeederBaseCombinedPlacePoint',
  'ShiftFeederTubesPlacePoint',
  'ShiftFeederUpperPlacePoint',
  'ShakingGratePlacePoint',
  'FeederPipesPlacePoint',
  'DanicingRollerPlacePoint',
  'SkimmingAssemblyPlacePoint',
  // trolley
  'Trolley_Cart 1A',
]);

const STRIP_SFX_CLIPS = new Set([
  'IntroChime',
  'InstructionChime',
  'TrolleyArrival',
  'InspectionConfirm',
  'ChapterComplete',
  'VerificationSuccess',
  'AmbientWorkshop', // duplicate ambient layer
]);

// ----- helpers -----
function isSpawnTarget(action) {
  return action
    && action.Name === 'Objects'
    && action.Option === 'Spawn'
    && HOIST_TARGETS.has(action.Query);
}

function isStripSfx(action) {
  if (!action || (action.Name !== 'SFXPlayer' && action.Query !== 'SFXPlayer')) return false;
  if (action.Option === 'StopAndSkip') return true; // drop all StopAndSkip — they cut the ambient
  if (typeof action.Data !== 'string') return false;
  try {
    const d = JSON.parse(action.Data);
    return d && typeof d.audioClipName === 'string' && STRIP_SFX_CLIPS.has(d.audioClipName);
  } catch (e) { return false; }
}

function uniqueSpawnActions(list) {
  const seen = new Set();
  const out = [];
  for (const a of list) {
    if (!seen.has(a.Query)) {
      seen.add(a.Query);
      out.push({
        Query: a.Query,
        Name: 'Objects',
        Option: 'Spawn',
        Data: '{"waitForCompletion":true}',
      });
    }
  }
  return out;
}

// ----- 1+3: walk every moment, collect spawn targets, strip SFX -----
const spawnPool = [];
let spawnHoisted = 0;
let sfxStripped = 0;
let stopAndSkipStripped = 0;

const moments = [];
for (const ch of story.chapters || []) {
  for (const m of ch.moments || []) {
    moments.push(m);
  }
}

moments.forEach((moment, idx) => {
  const sections = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning'];
  for (const sec of sections) {
    const node = moment[sec];
    if (!node || !Array.isArray(node.actions)) continue;
    const kept = [];
    for (const action of node.actions) {
      if (isSpawnTarget(action) && idx !== 0) {
        spawnPool.push(action);
        spawnHoisted++;
        continue;
      }
      if (isStripSfx(action)) {
        if (action.Option === 'StopAndSkip') stopAndSkipStripped++;
        else sfxStripped++;
        continue;
      }
      kept.push(action);
    }
    node.actions = kept;
  }

  // onRight: triggerActionSets each have .actions
  if (moment.onRight && Array.isArray(moment.onRight.triggerActionSets)) {
    for (const tas of moment.onRight.triggerActionSets) {
      if (!Array.isArray(tas.actions)) continue;
      tas.actions = tas.actions.filter(a => {
        if (isStripSfx(a)) {
          if (a.Option === 'StopAndSkip') stopAndSkipStripped++;
          else sfxStripped++;
          return false;
        }
        return true;
      });
    }
  }

  // onWrong is an array of trigger sets
  if (Array.isArray(moment.onWrong)) {
    for (const tas of moment.onWrong) {
      if (!Array.isArray(tas.actions)) continue;
      tas.actions = tas.actions.filter(a => {
        if (isStripSfx(a)) {
          if (a.Option === 'StopAndSkip') stopAndSkipStripped++;
          else sfxStripped++;
          return false;
        }
        return true;
      });
    }
  }
});

// ----- 1: prepend hoisted spawns to M0.onAwake -----
const m0 = moments[0];
m0.onAwake = m0.onAwake || { actions: [] };
m0.onAwake.actions = m0.onAwake.actions || [];

// also pick up any existing spawn actions already in M0.onAwake to dedupe
const existingM0Spawns = m0.onAwake.actions.filter(isSpawnTarget);
const combined = [...existingM0Spawns, ...spawnPool];
const dedupedSpawns = uniqueSpawnActions(combined);

// Remove existing spawn actions from M0.onAwake (we'll re-insert the deduped set at the top)
m0.onAwake.actions = m0.onAwake.actions.filter(a => !isSpawnTarget(a));

// Prepend deduped spawns
m0.onAwake.actions = [...dedupedSpawns, ...m0.onAwake.actions];

// ----- 2: lower AmbientFactoryHum volume in M0.onAwake -----
let ambientTouched = 0;
for (const action of m0.onAwake.actions) {
  if (
    (action.Name === 'SFXPlayer' || action.Query === 'SFXPlayer') &&
    action.Option === 'PlayLoop' &&
    typeof action.Data === 'string'
  ) {
    try {
      const d = JSON.parse(action.Data);
      if (d && d.audioClipName === 'AmbientFactoryHum') {
        d.setVolume = 0.15;
        d.audioRange = 12;
        action.Data = JSON.stringify(d);
        ambientTouched++;
      }
    } catch (e) {}
  }
}

// ----- 4: rewrite M7 -----
const m7 = moments[7]; // M7 = chapter 2 moment 0 = "Position Shift Feeder Shaking Tray"
if (!m7 || !/Shaking Tray/i.test(m7.name || '')) {
  throw new Error('M7 lookup failed — name does not match expected Shaking Tray moment.');
}

m7.description = 'The Shift Feeder Shaking Tray automatically animates into position on the ShakingGratePlacePoint after a short delay. No player interaction is required.';

m7.onAwake = {
  actions: [
    {
      Query: 'Shift Feeder Shaking Tray',
      Name: 'GrabbablePropertyChangeAction',
      Option: 'ChangeIsGrabbable',
      Data: '{"isGrabbable":false,"waitForCompletion":false}',
    },
    {
      Query: 'Shift Feeder Shaking Tray',
      Name: 'MetaLayerAction',
      Option: 'SetActive',
      Data: '{"Outline":false,"Label":false,"Highlighter":false}',
    },
    {
      Query: 'ShakingGratePlacePoint',
      Name: 'MetaLayerAction',
      Option: 'SetActive',
      Data: '{"Outline":false,"Label":false,"Highlighter":false}',
    },
  ],
};

m7.onStart = {
  actions: [
    {
      Query: 'VOPlayer',
      Name: 'VoiceOver',
      Option: 'Play',
      Data: '{"text":"Now watch as the Shift Feeder Shaking Tray automatically moves into position. This component will animate itself onto the grate mount.","waitForCompletion":true}',
    },
    {
      Query: 'CountDownTimer',
      Name: 'TimerAction',
      Option: 'Start',
      Data: '{"duration":2.0,"waitForCompletion":true}',
    },
    {
      Query: 'Shift Feeder Shaking Tray',
      Name: 'ObjectAnimationAction',
      Option: 'PositionRotation',
      Data: '{"targetTransform":"ShakingGratePlacePoint","lerpDuration":2.5,"waitForCompletion":true}',
    },
    {
      Query: 'SFXPlayer',
      Name: 'SFXPlayer',
      Option: 'Play',
      Data: '{"audioClipName":"VibrationDampingSettle","useCloudAudio":true,"audioUrl":"https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/43c7b018-d363-47fa-941d-202d50a8be6c.mp3","audioRange":8,"setVolume":0.6,"waitForCompletion":true}',
    },
    {
      Query: 'VOPlayer',
      Name: 'VoiceOver',
      Option: 'Play',
      Data: '{"text":"The Shift Feeder Shaking Tray is now in position. The shaking mechanism is ready for operation.","waitForCompletion":true}',
    },
  ],
};

m7.onRight = { mode: 'InOrder', triggerActionSets: [] };
m7.onWrong = [];
m7.onFirstWarning = { actions: [] };
m7.onLastWarning = { actions: [] };

m7.onEnd = {
  actions: [
    {
      Query: 'VOPlayer',
      Name: 'VoiceOver',
      Option: 'Play',
      Data: '{"text":"With the shaking tray placed, we can now move on to attaching the feeding chute.","waitForCompletion":true}',
    },
  ],
};

// ----- write back -----
fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');

console.log(JSON.stringify({
  spawnHoisted,
  uniqueSpawnsAtM0: dedupedSpawns.length,
  sfxStripped,
  stopAndSkipStripped,
  ambientTouched,
  m7Rewritten: true,
}, null, 2));
