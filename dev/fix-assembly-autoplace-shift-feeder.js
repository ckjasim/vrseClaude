// Convert every "Shift Feeder *" install moment (M3-M8 except M7 already done)
// into the no-interaction timer + ObjectAnimationAction auto-place pattern.
// Preserve the existing instruction/transition VO text wherever possible.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

const SFX_URL = {
  SnapInClick: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/cedbc34f-ab5a-4f64-9b7c-4b50e67ee1bd.mp3',
  MetallicClick: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/0131d7df-139d-46fc-9cd3-2fa82070218b.mp3',
  BaseCombinedSnap: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/71fc698a-c063-419e-8eff-52eabef2c292.mp3',
  TubeAssemblyLock: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/a8098142-3afe-4b9f-abaa-cb11ce0141a0.mp3',
  ChuteAttach: 'https://d3rispyzvykwg6.cloudfront.net/stories/assembly_training/sfx/54118b3f-ef82-45f3-8a49-e3144853bc31.mp3',
};

// Per-moment specs: which moment global index, which grabbable, which placepoint, which SFX.
const SPEC = [
  {
    gi: 3,
    grabbable: 'Shift Feeder Base',
    placepoint: 'ShiftFeederBottomPlacePoint',
    sfx: 'SnapInClick',
    instructionVO: "Now we'll begin building the shift feeder base assembly. Watch as the Shift Feeder Base automatically moves into position on the chassis mounting point.",
    successVO: "The Shift Feeder Base is now secured. This forms the foundation for the rest of the assembly.",
    transitionVO: "Excellent. The base is installed. Next, the base cover will be attached.",
  },
  {
    gi: 4,
    grabbable: 'Shift Feeder Base Cover',
    placepoint: 'ShiftFeederUpperCoverPlacePoint',
    sfx: 'MetallicClick',
    instructionVO: "Next, the Shift Feeder Base Cover will animate into place directly above the installed base.",
    successVO: "The base cover is now locked in place above the base.",
    transitionVO: "Good. The cover is installed. We'll continue with the combined base assembly.",
  },
  {
    gi: 5,
    grabbable: 'ShiftFeederBaseCombined',
    placepoint: 'ShiftFeederBaseCombinedPlacePoint',
    sfx: 'BaseCombinedSnap',
    instructionVO: "Now watch as the combined base assembly moves into position at the center of the chassis.",
    successVO: "The combined base assembly is now securely seated.",
    transitionVO: "Excellent. The combined base is integrated. Next, the tube assembly will be installed.",
  },
  {
    gi: 6,
    grabbable: 'Shift Feeder Tube Assembly',
    placepoint: 'ShiftFeederTubesPlacePoint',
    sfx: 'TubeAssemblyLock',
    instructionVO: "Now watch the Shift Feeder Tube Assembly move into position along the side of the base.",
    successVO: "The Shift Feeder Tube Assembly is now properly installed.",
    transitionVO: "Excellent work. The base build-up phase is complete. We'll continue with the next assembly stage.",
  },
  // M7 already converted in the previous pass.
  {
    gi: 8,
    grabbable: 'Shift Feeder Feeding Chute',
    placepoint: 'ShiftFeederUpperPlacePoint',
    sfx: 'ChuteAttach',
    instructionVO: "Now the Shift Feeder Feeding Chute will animate into position above the shift feeder assembly, establishing the feed path from the hopper.",
    successVO: "The feeding chute is securely attached and the feed path is established.",
    transitionVO: "The feeding chute is in place. Let's continue with the next component.",
  },
];

const moments = [];
story.chapters.forEach(c => c.moments.forEach(m => moments.push(m)));

function buildAutoPlaceMoment(m, spec) {
  const sfxUrl = SFX_URL[spec.sfx];
  if (!sfxUrl) throw new Error('Missing SFX URL for ' + spec.sfx);

  // Keep original name/description meta but overwrite description for honesty.
  m.description = `${spec.grabbable} automatically animates into position on ${spec.placepoint}. No player interaction is required.`;

  m.onAwake = {
    actions: [
      {
        Query: spec.grabbable,
        Name: 'GrabbablePropertyChangeAction',
        Option: 'ChangeIsGrabbable',
        Data: '{"isGrabbable":false,"waitForCompletion":false}',
      },
      {
        Query: spec.grabbable,
        Name: 'MetaLayerAction',
        Option: 'SetActive',
        Data: '{"Outline":false,"Label":false,"Highlighter":false}',
      },
      {
        Query: spec.placepoint,
        Name: 'MetaLayerAction',
        Option: 'SetActive',
        Data: '{"Outline":false,"Label":false,"Highlighter":false}',
      },
    ],
  };

  m.onStart = {
    actions: [
      {
        Query: 'VOPlayer',
        Name: 'VoiceOver',
        Option: 'Play',
        Data: JSON.stringify({ text: spec.instructionVO, waitForCompletion: true }),
      },
      {
        Query: 'CountDownTimer',
        Name: 'TimerAction',
        Option: 'Start',
        Data: '{"duration":2.0,"waitForCompletion":true}',
      },
      {
        Query: spec.grabbable,
        Name: 'ObjectAnimationAction',
        Option: 'PositionRotation',
        Data: JSON.stringify({ targetTransform: spec.placepoint, lerpDuration: 2.5, waitForCompletion: true }),
      },
      {
        Query: 'SFXPlayer',
        Name: 'SFXPlayer',
        Option: 'Play',
        Data: JSON.stringify({
          audioClipName: spec.sfx,
          useCloudAudio: true,
          audioUrl: sfxUrl,
          audioRange: 8,
          setVolume: 0.6,
          waitForCompletion: true,
        }),
      },
      {
        Query: 'VOPlayer',
        Name: 'VoiceOver',
        Option: 'Play',
        Data: JSON.stringify({ text: spec.successVO, waitForCompletion: true }),
      },
    ],
  };

  m.onRight = { mode: 'InOrder', triggerActionSets: [] };
  m.onWrong = [];
  m.onFirstWarning = { actions: [] };
  m.onLastWarning = { actions: [] };

  m.onEnd = {
    actions: [
      {
        Query: 'VOPlayer',
        Name: 'VoiceOver',
        Option: 'Play',
        Data: JSON.stringify({ text: spec.transitionVO, waitForCompletion: true }),
      },
    ],
  };
}

const converted = [];
for (const spec of SPEC) {
  const m = moments[spec.gi];
  if (!m) throw new Error('Moment global index ' + spec.gi + ' not found');
  // sanity check: name should contain the grabbable noun
  buildAutoPlaceMoment(m, spec);
  converted.push({ gi: spec.gi, name: m.name });
}

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({ converted }, null, 2));
