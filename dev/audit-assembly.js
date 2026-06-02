// Complete audit of Assembly_Training.json. Surfaces any flaw category.
const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

// ----- catalogs -----
const ACTION_CATALOG = {
  AllGrabbablePropertyToggleAction: ['Enable','Disable'],
  AlphaDesaturateAction: ['SetDesaturation','Desaturate','Saturate'],
  Animation: ['Play','Pause','Resume','Stop'],
  BroadcastMessageAction: [''],
  ChecklistUIToggle: ['Configure','Current','Check','Uncheck'],
  ComponentToggleAction: ['Enable','Disable'],
  ForcepsAction: ['SetProperties','ForcepLock','ForcepUnlock','ClearProperties'],
  GrabLockAction: ['GrabLock','GrabUnlock'],
  GrabbablePropertyChangeAction: ['ChangeIsGrabbable','ChangeHandType','ChangeResetTransformOnRelease','ChangeEnableGrabbableAnimated'],
  HapticsAction: ['Left','Right','Both'],
  ImageMediaAction: ['Enable','Disable'],
  MCQResponseAction: [''],
  MaterialPropertyChangeAction: ['EnableEmission','DisableEmission'],
  MetaLayerAction: ['SetActive','Edit'],
  ObjectAnimationAction: ['Position','Rotation','Scale','PositionRotation','PositionScale','RotationScale','PositionRotationScale'],
  Objects: ['Spawn','Despawn'],
  PivotRotateLimiterAction: ['Enable','Disable','SetToMin','SetToMax','SetToSpecific','LockOnMin','LockOnMax','LockOnSpecific','Unlock'],
  Player: ['Teleport','CameraFade','LockMovement','UnlockMovement','LockRotation','UnlockRotation'],
  RadialStateAction: ['SetSaturation','IncrementStep','Reset'],
  SFXPlayer: ['Play','PlayLoop','Pause','StopAndSkip'],
  ScriptableAction: [''],
  TargetGuidanceArrowAction: ['Enable','Disable','Override'],
  TextMediaAction: ['Enable','Disable'],
  TimerAction: ['Start'],
  ToastMessage: [''],
  TransformBoundsAction: ['Enable','Disable','Lock','Unlock','CreateCombination','RemoveCombination','SetThreshold'],
  UIPropertyChangeAction: ['ChangeText','AppendText'],
  VideoMediaAction: ['Enable','Disable'],
  VoiceOver: ['Play'],
};

// Real scene objects per Unity discovery
const SCENE_OBJECTS = new Set([
  // defaults
  'VOPlayer','SFXPlayer','CountDownTimer','Haptics',
  // grabbables
  'Shift Feeder Base','Shift Feeder Base Cover','ShiftFeederBaseCombined',
  'Shift Feeder Tube Assembly','Shift Feeder Feeding Chute','Shift Feeder Shaking Tray',
  'Feeder Pipe','Dancing Roller','Skimming Assembly','Tablet Discharge Chute',
  'Clamps_1','Clamps_2','ClampPivot1','ClampPivot2',
  // placepoints
  'ShiftFeederBottomPlacePoint','ShiftFeederUpperCoverPlacePoint','ShiftFeederBaseCoverPlacePoint',
  'ShiftFeederBaseCombinedPlacePoint','ShiftFeederTubesPlacePoint','ShiftFeederUpperPlacePoint',
  'ShakingGratePlacePoint','FeederPipesPlacePoint','DanicingRollerPlacePoint','SkimmingAssemblyPlacePoint',
  // touchables
  'AdapterRoller','Cooling Roller','CoolingRoller','Counter Sealing Roller','DustCollector_Plate02',
  'DyePlates_1 (Lower)','DyePlates_2 (Upper)','Feeder_Assembly_FrontPlate','FeederAssembly_Plate02',
  'GlassPlate','GuideTrack01','GuideTrack02','Hopper Assembly','Hopper Base','HopperTop_Chute_DetachedTouch',
  'IndexingClampUpper','IndexRoller','IShaped_Plate02','Metal_SideHolder_02_I','PickupTool',
  'Pos4Obj','Pos5Obj','PunchingDye','PunchingTool01','PunchingTool02','Ring Roller Assembly',
  'SkippingTool','Sliding_Plate_01','SpringRoller','Sweep Brush','Trol1','Trolley_Cart_2B',
  'Trolley_Rack','Vibrator_Plate',
  // trolleys
  'Trolley_Cart 1A','Trolley_Cart_3A','Metal_Pallet_rack',
  // UI
  'ButtonUI','TouchButton','Feeder_ImagePanel_UI','Matcon_ImagePanel_UI',
  // vrse system
  'EXPERIENCE PANEL_NEW',
  // ghosts
  'AdapterRollerGhost','CoolingRollerGhost','CounterSealingRollerGhost','IndexRollerGhost',
  'PickupToolGhost','PunchingDyeGhost','PunchingTool01Ghost','PunchingTool02Ghost','SkippingToolGhost',
  // Pos / rotation targets
  'AdapterRollerPos','ChutePos','ClampRot1','ClampRot2','CoolingRollerPos','CounterSealingPos','EXPPos',
  'FeederPipesPos','GuideTrack1Pos','GuideTrack2Pos','HopperBasePos','HopperPos','IndexingClampLowerPos',
  'IndexingClampUpperPos','IndexingGuidePos','IndexRollerPos','LowerDiePos','PerforationPos','PickUpToolPos',
  'PunchingDyePos','PunchingToolPos','RingRollerAssemblyPos','RingRollerPos','SkippingToolPos','SweepBrushPos',
  'SwwpBrushPosNew','TrolleyPos1','TrolleyPos2','TrollyPos4','TrollyPos5','UpperDiePos',
  // spawnpoints
  'TPos4','TPos5','TPos23','TRPos',
]);

const issues = {
  invalidActionName: [],
  invalidActionOption: [],
  invalidQuery: [],
  invalidTargetTransform: [],
  invalidDataJson: [],
  unresolvedAudioUrl: [],
  voNotUsingVOPlayer: [],
  sfxNotUsingSFXPlayer: [],
  interactiveRemnant: [],
  duplicateAmbient: [],
  trolleyDespawn: [],
};

const stats = {
  totalMoments: 0,
  autoMoments: 0,
  interactiveMoments: 0,
  totalActions: 0,
  voActions: 0,
  sfxActions: 0,
  ambientLoops: 0,
};

const moments = [];
story.chapters.forEach(c => c.moments.forEach(m => moments.push(m)));
stats.totalMoments = moments.length;

function validateAction(action, atPath) {
  stats.totalActions++;
  const { Name, Option, Query, Data } = action;

  // Action name validity
  if (!ACTION_CATALOG[Name]) {
    issues.invalidActionName.push({ at: atPath, name: Name });
    return;
  }
  // Option validity
  const opts = ACTION_CATALOG[Name];
  if (!opts.includes(Option === undefined ? '' : Option) && !(opts.includes('') && Option === undefined)) {
    issues.invalidActionOption.push({ at: atPath, name: Name, option: Option });
  }
  // Query validity (skip system-only actions like Player/Teleport that may not need a scene object)
  if (Query !== undefined && Query !== '') {
    if (!SCENE_OBJECTS.has(Query)) {
      issues.invalidQuery.push({ at: atPath, query: Query });
    }
  }
  // Data JSON
  let parsed = null;
  if (Data !== undefined) {
    if (typeof Data !== 'string') {
      issues.invalidDataJson.push({ at: atPath, note: 'Data is not a string' });
    } else if (Data !== '') {
      try { parsed = JSON.parse(Data); } catch (e) {
        issues.invalidDataJson.push({ at: atPath, error: e.message });
      }
    }
  }
  // Per-action semantic checks
  if (parsed) {
    if (Name === 'ObjectAnimationAction' && parsed.targetTransform) {
      if (!SCENE_OBJECTS.has(parsed.targetTransform)) {
        issues.invalidTargetTransform.push({ at: atPath, targetTransform: parsed.targetTransform });
      }
    }
    if (Name === 'SFXPlayer' && (Option === 'Play' || Option === 'PlayLoop')) {
      stats.sfxActions++;
      if (Option === 'PlayLoop' && parsed.audioClipName === 'AmbientFactoryHum') stats.ambientLoops++;
      if (typeof parsed.audioUrl === 'string' && /GENERATE_THIS/i.test(parsed.audioUrl)) {
        issues.unresolvedAudioUrl.push({ at: atPath, clip: parsed.audioClipName });
      }
    }
  }
  if (Name === 'VoiceOver') {
    stats.voActions++;
    if (Query !== 'VOPlayer') issues.voNotUsingVOPlayer.push({ at: atPath, actual: Query });
  }
  if (Name === 'SFXPlayer') {
    if (Query !== 'SFXPlayer') issues.sfxNotUsingSFXPlayer.push({ at: atPath, actual: Query });
  }
  if (Name === 'Objects' && Option === 'Despawn' && Query === 'Trolley_Cart 1A') {
    issues.trolleyDespawn.push({ at: atPath });
  }
}

moments.forEach((m, gi) => {
  const interactive =
    (m.onRight && m.onRight.triggerActionSets && m.onRight.triggerActionSets.length > 0) ||
    (Array.isArray(m.onWrong) && m.onWrong.length > 0);
  if (interactive) {
    stats.interactiveMoments++;
    issues.interactiveRemnant.push({ at: 'M' + gi + ' ' + m.name,
      onRightSets: m.onRight.triggerActionSets.length, onWrongCount: m.onWrong.length });
  } else stats.autoMoments++;

  const sections = [
    ['onAwake', m.onAwake && m.onAwake.actions],
    ['onStart', m.onStart && m.onStart.actions],
    ['onEnd', m.onEnd && m.onEnd.actions],
    ['onFirstWarning', m.onFirstWarning && m.onFirstWarning.actions],
    ['onLastWarning', m.onLastWarning && m.onLastWarning.actions],
  ];
  for (const [sec, list] of sections) {
    if (!Array.isArray(list)) continue;
    list.forEach((a, i) => validateAction(a, `M${gi}.${sec}[${i}]`));
  }
  if (m.onRight && Array.isArray(m.onRight.triggerActionSets)) {
    m.onRight.triggerActionSets.forEach((tas, ti) => {
      if (tas.actions) tas.actions.forEach((a, ai) =>
        validateAction(a, `M${gi}.onRight.set[${ti}].action[${ai}]`));
    });
  }
  if (Array.isArray(m.onWrong)) {
    m.onWrong.forEach((tas, ti) => {
      if (tas.actions) tas.actions.forEach((a, ai) =>
        validateAction(a, `M${gi}.onWrong.set[${ti}].action[${ai}]`));
    });
  }
});

if (stats.ambientLoops > 1) {
  issues.duplicateAmbient.push({ count: stats.ambientLoops });
}

console.log('=== STATS ===');
console.log(JSON.stringify(stats, null, 2));

console.log('\n=== ISSUES ===');
let totalIssues = 0;
for (const [cat, list] of Object.entries(issues)) {
  if (list.length === 0) continue;
  totalIssues += list.length;
  console.log('\n[' + cat + '] ' + list.length + ' item(s):');
  list.forEach(it => console.log('  ' + JSON.stringify(it)));
}
if (totalIssues === 0) {
  console.log('  NONE — story is clean.');
}

console.log('\n=== TOTAL ISSUES: ' + totalIssues + ' ===');
