# Assembly_Training — Scene Awareness

This document is the authoritative record of the **Assembly_Training** Unity scene. Only objects listed below exist. Any other reference is invalid.

## Scene summary

Pharmaceutical / industrial **Shift Feeder + Tablet Press** assembly trainer. Player receives parts on a trolley and assembles the full shift feeder onto a fixed tablet-press chassis, then verifies and secures. No `#h4 Chapter N` folders exist in the scene — chapter partitioning is the author's choice.

## Default query objects (required)

- `VOPlayer` — use as Query for ALL VoiceOver actions
- `SFXPlayer` — use as Query for ALL SFX actions
- `Haptics`
- `CountDownTimer`

## Grabbables

- `Shift Feeder Base`
- `Shift Feeder Base Cover`
- `ShiftFeederBaseCombined`
- `Shift Feeder Tube Assembly`
- `Shift Feeder Feeding Chute`
- `Shift Feeder Shaking Tray`
- `Feeder Pipe`
- `Dancing Roller`
- `Skimming Assembly`
- `Tablet Discharge Chute`
- `Clamps_1`
- `Clamps_2`
- `ClampPivot1`
- `ClampPivot2`

## Placepoints (each paired with a grabbable)

- `ShiftFeederBottomPlacePoint` — receives `Shift Feeder Base`
- `ShiftFeederUpperCoverPlacePoint` — receives `Shift Feeder Base Cover`
- `ShiftFeederBaseCoverPlacePoint` — alternate for base cover
- `ShiftFeederBaseCombinedPlacePoint` — receives `ShiftFeederBaseCombined`
- `ShiftFeederTubesPlacePoint` — receives `Shift Feeder Tube Assembly`
- `ShiftFeederUpperPlacePoint` — receives `Shift Feeder Feeding Chute`
- `ShakingGratePlacePoint` — receives `Shift Feeder Shaking Tray`
- `FeederPipesPlacePoint` — receives `Feeder Pipe`
- `DanicingRollerPlacePoint` — receives `Dancing Roller` (spelling "Danicing" is intentional)
- `SkimmingAssemblyPlacePoint` — receives `Skimming Assembly`

## Touchables

`AdapterRoller`, `Cooling Roller`, `CoolingRoller`, `Counter Sealing Roller`, `DustCollector_Plate02`, `DyePlates_1 (Lower)`, `DyePlates_2 (Upper)`, `Feeder_Assembly_FrontPlate`, `FeederAssembly_Plate02`, `GlassPlate`, `GuideTrack01`, `GuideTrack02`, `Hopper Assembly`, `Hopper Base`, `HopperTop_Chute_DetachedTouch`, `IndexingClampUpper`, `IndexRoller`, `IShaped_Plate02`, `Metal_SideHolder_02_I`, `PickupTool`, `Pos4Obj`, `Pos5Obj`, `PunchingDye`, `PunchingTool01`, `PunchingTool02`, `Ring Roller Assembly`, `SkippingTool`, `Sliding_Plate_01`, `SpringRoller`, `Sweep Brush`, `Trol1`, `Trolley_Cart_2B`, `Trolley_Rack`, `Vibrator_Plate`

## Trolleys / carts

- `Trolley_Cart 1A`
- `Trolley_Cart_2B`
- `Trolley_Cart_3A`
- `Trolley_Rack`
- `Metal_Pallet_rack`

## UI

- `ButtonUI`
- `TouchButton`
- `Feeder_ImagePanel_UI`
- `Matcon_ImagePanel_UI`

## VRse system

- `EXPERIENCE PANEL_NEW` — intro + outro anchor

## Ghost hints (placement visualizers)

`AdapterRollerGhost`, `CoolingRollerGhost`, `CounterSealingRollerGhost`, `IndexRollerGhost`, `PickupToolGhost`, `PunchingDyeGhost`, `PunchingTool01Ghost`, `PunchingTool02Ghost`, `SkippingToolGhost`

## Position / animation targets

`AdapterRollerPos`, `ChutePos`, `ClampRot1`, `ClampRot2`, `CoolingRollerPos`, `CounterSealingPos`, `EXPPos`, `FeederPipesPos`, `GuideTrack1Pos`, `GuideTrack2Pos`, `HopperBasePos`, `HopperPos`, `IndexingClampLowerPos`, `IndexingClampUpperPos`, `IndexingGuidePos`, `IndexRollerPos`, `LowerDiePos`, `PerforationPos`, `PickUpToolPos`, `PunchingDyePos`, `PunchingToolPos`, `RingRollerAssemblyPos`, `RingRollerPos`, `SkippingToolPos`, `SweepBrushPos`, `SwwpBrushPosNew`, `TrolleyPos1`, `TrolleyPos2`, `TrollyPos4`, `TrollyPos5`, `UpperDiePos`

## Spawnpoints

- `TPos4`, `TPos5`, `TPos23`, `TRPos`

## Rules

1. Every VoiceOver action uses Query `VOPlayer`. Every SFX action uses Query `SFXPlayer`.
2. All other `Query` values must match an object from this list **exactly**, including spelling and spacing (e.g. `Cooling Roller` has a space, `DanicingRollerPlacePoint` uses "Danicing").
3. Do not invent objects. Do not reference `Player`, `ToastMessage`, `ToastPanel`, `TargetArrow`, or any generic UI concept — none exist here.
4. When narrating without a scene object, direct the action at `VOPlayer` with no `TargetGameObject`.
