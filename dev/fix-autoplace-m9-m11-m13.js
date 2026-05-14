// Convert M9 (Feeder Pipe), M10 (Dancing Roller), M11 (Skimming Assembly),
// and M13 (Secure Clamps) into no-interaction timer + ObjectAnimationAction
// auto-place moments — matching the pattern already applied to M3-M8.
//
// M9/M10/M11 each animate their single grabbable to its placepoint.
// M13 is special: two clamps. Animate Clamps_1 then Clamps_2 in sequence,
// each rotating to ClampRot1 / ClampRot2 (the rotation targets from the scene catalog).

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

const SFX_URL = {
  PipeConnectionClick: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/b4573fff-5b70-42ed-8fca-9d22aa750721.mp3',
  RollerPlacement: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/89a18499-d42d-4577-ad64-20a7280fdc98.mp3',
  SkimmingAssemblyLock: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/f576e850-27ea-4267-b901-9477d05d79d3.mp3',
  ClampRatchetLock: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/71c1410b-123d-40a8-9dd8-daaac061f120.mp3',
};

const moments = [];
story.chapters.forEach(c => c.moments.forEach(m => moments.push(m)));

function buildSingleAutoPlace(m, spec) {
  m.description = `${spec.grabbable} automatically animates into position on ${spec.placepoint}. No player interaction is required.`;

  m.onAwake = {
    actions: [
      { Query: spec.grabbable, Name: 'GrabbablePropertyChangeAction', Option: 'ChangeIsGrabbable',
        Data: '{"isGrabbable":false,"waitForCompletion":false}' },
      { Query: spec.grabbable, Name: 'MetaLayerAction', Option: 'SetActive',
        Data: '{"Outline":false,"Label":false,"Highlighter":false}' },
      { Query: spec.placepoint, Name: 'MetaLayerAction', Option: 'SetActive',
        Data: '{"Outline":false,"Label":false,"Highlighter":false}' },
    ],
  };

  m.onStart = {
    actions: [
      { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
        Data: JSON.stringify({ text: spec.instructionVO, waitForCompletion: true }) },
      { Query: 'CountDownTimer', Name: 'TimerAction', Option: 'Start',
        Data: '{"duration":2.0,"waitForCompletion":true}' },
      { Query: spec.grabbable, Name: 'ObjectAnimationAction', Option: 'PositionRotation',
        Data: JSON.stringify({ targetTransform: spec.placepoint, lerpDuration: 2.5, waitForCompletion: true }) },
      { Query: 'SFXPlayer', Name: 'SFXPlayer', Option: 'Play',
        Data: JSON.stringify({
          audioClipName: spec.sfx, useCloudAudio: true, audioUrl: SFX_URL[spec.sfx],
          audioRange: 8, setVolume: 0.6, waitForCompletion: true,
        }) },
      { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
        Data: JSON.stringify({ text: spec.successVO, waitForCompletion: true }) },
    ],
  };

  m.onRight = { mode: 'InOrder', triggerActionSets: [] };
  m.onWrong = [];
  m.onFirstWarning = { actions: [] };
  m.onLastWarning = { actions: [] };
  m.onEnd = {
    actions: [
      { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
        Data: JSON.stringify({ text: spec.transitionVO, waitForCompletion: true }) },
    ],
  };
}

// ----- M9 Feeder Pipe -----
buildSingleAutoPlace(moments[9], {
  grabbable: 'Feeder Pipe',
  placepoint: 'FeederPipesPlacePoint',
  sfx: 'PipeConnectionClick',
  instructionVO: "Now watch as the Feeder Pipe automatically connects to the connection point on the right side of the feeder chute, establishing the pneumatic feed line for material transfer.",
  successVO: "The feeder pipe is now securely connected and the pneumatic feed line is established.",
  transitionVO: "The feeder pipe connection is complete. Let's continue to the next component.",
});

// ----- M10 Dancing Roller -----
buildSingleAutoPlace(moments[10], {
  grabbable: 'Dancing Roller',
  placepoint: 'DanicingRollerPlacePoint',
  sfx: 'RollerPlacement',
  instructionVO: "Now the Dancing Roller will move into position on the bearing mounts at the front of the feeder assembly.",
  successVO: "The Dancing Roller is now installed and seated into the bearing mounts.",
  transitionVO: "The Dancing Roller is in place. Let's continue with the next assembly step.",
});

// ----- M11 Skimming Assembly -----
buildSingleAutoPlace(moments[11], {
  grabbable: 'Skimming Assembly',
  placepoint: 'SkimmingAssemblyPlacePoint',
  sfx: 'SkimmingAssemblyLock',
  instructionVO: "Now watch as the Skimming Assembly mounts onto the guide rails at the upper-front edge of the feeder. This component removes excess material from the top of the feeding stream.",
  successVO: "The skimming assembly is now locked into the guide rails. The feeder, tray, and roller assembly is complete.",
  transitionVO: "Outstanding. With the skimming assembly in place, we've completed this section. Next, we'll move on to the final assembly steps.",
});

// ----- M13 Clamps (two-clamp sequence) -----
const m13 = moments[13];
m13.description = "Clamps_1 and Clamps_2 automatically rotate into their locked positions to secure the shift feeder onto the chassis. No player interaction is required.";

m13.onAwake = {
  actions: [
    { Query: 'Clamps_1', Name: 'GrabbablePropertyChangeAction', Option: 'ChangeIsGrabbable',
      Data: '{"isGrabbable":false,"waitForCompletion":false}' },
    { Query: 'Clamps_2', Name: 'GrabbablePropertyChangeAction', Option: 'ChangeIsGrabbable',
      Data: '{"isGrabbable":false,"waitForCompletion":false}' },
    { Query: 'Clamps_1', Name: 'MetaLayerAction', Option: 'SetActive',
      Data: '{"Outline":false,"Label":false,"Highlighter":false}' },
    { Query: 'Clamps_2', Name: 'MetaLayerAction', Option: 'SetActive',
      Data: '{"Outline":false,"Label":false,"Highlighter":false}' },
  ],
};

m13.onStart = {
  actions: [
    { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
      Data: JSON.stringify({
        text: "Now watch as both clamps automatically rotate into their locked positions, securing the shift feeder onto the chassis.",
        waitForCompletion: true,
      }) },
    { Query: 'CountDownTimer', Name: 'TimerAction', Option: 'Start',
      Data: '{"duration":1.5,"waitForCompletion":true}' },
    // First clamp rotates to ClampRot1
    { Query: 'Clamps_1', Name: 'ObjectAnimationAction', Option: 'Rotation',
      Data: JSON.stringify({ targetTransform: 'ClampRot1', lerpDuration: 1.8, waitForCompletion: true }) },
    { Query: 'SFXPlayer', Name: 'SFXPlayer', Option: 'Play',
      Data: JSON.stringify({
        audioClipName: 'ClampRatchetLock', useCloudAudio: true, audioUrl: SFX_URL.ClampRatchetLock,
        audioRange: 8, setVolume: 0.6, waitForCompletion: true,
      }) },
    { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
      Data: JSON.stringify({ text: "First clamp engaged. Now the second clamp.", waitForCompletion: true }) },
    // Second clamp rotates to ClampRot2
    { Query: 'Clamps_2', Name: 'ObjectAnimationAction', Option: 'Rotation',
      Data: JSON.stringify({ targetTransform: 'ClampRot2', lerpDuration: 1.8, waitForCompletion: true }) },
    { Query: 'SFXPlayer', Name: 'SFXPlayer', Option: 'Play',
      Data: JSON.stringify({
        audioClipName: 'ClampRatchetLock', useCloudAudio: true, audioUrl: SFX_URL.ClampRatchetLock,
        audioRange: 8, setVolume: 0.6, waitForCompletion: true,
      }) },
    { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
      Data: JSON.stringify({
        text: "Both clamps are now engaged. The shift feeder assembly is mechanically secured to the tablet-press chassis.",
        waitForCompletion: true,
      }) },
  ],
};

m13.onRight = { mode: 'InOrder', triggerActionSets: [] };
m13.onWrong = [];
m13.onFirstWarning = { actions: [] };
m13.onLastWarning = { actions: [] };
m13.onEnd = {
  actions: [
    { Query: 'VOPlayer', Name: 'VoiceOver', Option: 'Play',
      Data: JSON.stringify({
        text: "The shift feeder is now locked securely onto the chassis. Ready for the final verification step.",
        waitForCompletion: true,
      }) },
  ],
};

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({
  converted: ['M9 Feeder Pipe', 'M10 Dancing Roller', 'M11 Skimming Assembly', 'M13 Clamps (2-step)'],
}, null, 2));
