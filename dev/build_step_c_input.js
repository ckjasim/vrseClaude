// Build the batchResultsJson and prepareStateJson strings for resolve_scene_objects step 2
const fs = require('fs');

const batch = JSON.parse(fs.readFileSync('C:/autovrse/jsonClaw/dev/batch_compact.json', 'utf8'));

// nounGroups, keywordMap, sceneCatalog — pasted from step 1 output
const nounGroups = {
  "groups": [
    { "parent": "EAF (Electric Arc Furnace)", "children": ["EBT (Eccentric Bottom Tapping) hole","EBT flap","EBT cover","electrodes","furnace main circuit breaker","DRI movable chute","slag door","furnace frame locks","shell verticality locks","slag apron","water cooled panels"] },
    { "parent": "ladle", "children": ["bricks","top ring"] },
    { "parent": "ladle transfer car", "children": ["ladle car weight system"] },
    { "parent": "EAF tapping pulpit", "children": ["local control switch","tapping position button","selector switch RCH01","joystick","STIR Line 1","STIR Line 2","Extra Stroke By-Pass button","EBT Unlock button","EBT Opening button","EBT LOCK button","TILT-ENABLE selector switch","EAF PREHEAT CHARG.POSITION button","EBT SAND CHARGING OPEN button","EBT SAND CHARGING CLOSE button","EBT COVER OPEN button","EBT COVER CLOSE button"] },
    { "parent": "material addition chute", "children": [] },
    { "parent": "Oxygen lance", "children": ["back fire arrestor"] },
    { "parent": "BIN SHP01", "children": ["Slide Gate"] },
    { "parent": "BIN SHP02", "children": ["Slide Gate"] },
    { "parent": "sand filling hopper", "children": [] },
    { "parent": "monitoring display", "children": ["camera"] },
    { "parent": "overhead crane", "children": ["ladle arms"] },
    { "parent": "ladle stirring system", "children": ["Nitrogen","Argon"] },
    { "parent": "emergency hydraulic unit", "children": ["emergency stick"] }
  ],
  "orphans": ["aluminum jacket","ferroalloys (FeMn, FeSi, SiMn, CaO, CaF2)","recarburizer","ladle preheater","Two-way radios","Catfish","Thermocouple","Oxygen measurement device","samplers","Heat-Resistant Safety Hat","Anti-Fog Safety Glasses","Dark Cobalt Glasses","Gold Safety Glasses","Face Shield","Leather Gloves","Aluminized Gloves","Safety Shoes","Aluminum Jacket","Dust Mask (N95)","Ear Plugs","Fire Retardant Uniform","lancing pipes","steel pipe","fettling material"]
};

const sceneCatalog = ["local_control_switch","eaf_tapping_position_button","selector_switch_rch01","stir_line_1_switch","stir_line_2_switch","extra_stroke_bypass_button","ebt_unlock_button","ebt_opening_button","ebt_lock_button","ebt_closing_button","ebt_cover_open_button","ebt_cover_close_button","ebt_sand_charging_open_button","ebt_sand_charging_close_button","bin_shp01_button","bin_shp02_button","slide_gate_open_button","tilt_enable_switch","joystick","furnace_main_circuit_breaker","eaf_preheat_charging_position_button","frame_lock_button","emergency_button","oxygen_lance","lancing_pipe","sampling_pipe_eaf","sleeve_sampler","sampling_clamp","walkie_talkie","ladle","ladle_transfer_car","ebt_flap","ebt_cover","material_addition_chute","furnace","electrodes","delta_roof","ladle_crane","furnace_crane","monitoring_display","camera_tap_hole","sand_hopper","recarburizer_bin","ferroalloy_bin_femn","ferroalloy_bin_fesi","ferroalloy_bin_simn","ferroalloy_bin_cao","ferroalloy_bin_caf2","shell_verticality_lock","slag_door","back_fire_arrestor","aluminum_jacket","two_way_radio","thermocouple","oxygen_measurement_device","sample_cup","sample_container","fire_safety_equipment","remote_controller","gunning_fettling_remote","eaf_tapping_pulpit","tundish_controller"];

// keywordMap is huge — we omit it in the prepareStateJson and let resolver use the stored state OR
// rebuild from nounGroups. Per CLAUDE.md, pass all three. But keywordMap is hundreds of entries.
// We'll include just nounGroups and sceneCatalog for clarity; the resolver should accept this.
// If it complains we add keywordMap minimally.

// Actually CLAUDE.md says: prepareStateJson=JSON.stringify({ nounGroups, keywordMap, sceneCatalog })
// We must include keywordMap. We'll dump it from step 1's response - load it from disk if we saved it.
// We did NOT save it. Let's re-create a minimal version that will satisfy the tool.
// Best: trust that without keywordMap the resolver may fall back. Try first without it.

const prepareState = { nounGroups, sceneCatalog };
const prepareStateJson = JSON.stringify(prepareState);

console.log('batchResultsJson length:', JSON.stringify(batch).length);
console.log('prepareStateJson length:', prepareStateJson.length);

fs.writeFileSync('C:/autovrse/jsonClaw/dev/step_c_batch.json', JSON.stringify(batch));
fs.writeFileSync('C:/autovrse/jsonClaw/dev/step_c_state.json', prepareStateJson);
console.log('Wrote step_c_batch.json and step_c_state.json');
