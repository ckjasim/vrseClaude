// Convert M1 (Fixed Component Inspection) and M12 (Verification Tour) into
// pure narration moments. No touch interaction — VO describes each component
// in sequence with brief timer pauses. Empty onRight so the moment auto-advances.

const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

const moments = [];
story.chapters.forEach(c => c.moments.forEach(m => moments.push(m)));

function vo(text) {
  return {
    Query: 'VOPlayer',
    Name: 'VoiceOver',
    Option: 'Play',
    Data: JSON.stringify({ text, waitForCompletion: true }),
  };
}
function pause(seconds) {
  return {
    Query: 'CountDownTimer',
    Name: 'TimerAction',
    Option: 'Start',
    Data: JSON.stringify({ duration: seconds, waitForCompletion: true }),
  };
}

// ----- M1 Fixed Component Inspection — narration only -----
const m1 = moments[1];
m1.description = "Narrative overview of the three fixed components — Hopper Assembly, Index Roller, and Cooling Roller — without player interaction.";
m1.onAwake = { actions: [] };
m1.onStart = {
  actions: [
    vo("Before we begin assembly, let's introduce the three fixed components already mounted on this tablet press."),
    pause(0.5),
    vo("The Hopper Assembly stores and feeds raw tablets into the shift feeder system for downstream processing."),
    pause(0.5),
    vo("The Index Roller meters and regulates tablet flow through the system, ensuring consistent feed rates."),
    pause(0.5),
    vo("The Cooling Roller maintains optimal tablet temperature during processing to prevent coating damage."),
  ],
};
m1.onRight = { mode: 'InOrder', triggerActionSets: [] };
m1.onWrong = [];
m1.onFirstWarning = { actions: [] };
m1.onLastWarning = { actions: [] };
m1.onEnd = {
  actions: [
    vo("Now that you understand the fixed components, let's move on to the assembly process."),
  ],
};

// ----- M12 Verification Tour — narration only -----
const m12 = moments[12];
m12.description = "Narrative verification of three critical components — Cooling Roller, Sweep Brush, and Dye Plates — without player interaction.";
m12.onAwake = { actions: [] };
m12.onStart = {
  actions: [
    vo("Excellent. With the shift feeder assembled, let's perform a final verification of three critical components."),
    pause(0.5),
    vo("Cooling Roller verified. Component is operational and correctly seated."),
    pause(0.5),
    vo("Sweep Brush verified. Component is operational and correctly seated."),
    pause(0.5),
    vo("Dye Plates verified. Component is operational and correctly seated."),
  ],
};
m12.onRight = { mode: 'InOrder', triggerActionSets: [] };
m12.onWrong = [];
m12.onFirstWarning = { actions: [] };
m12.onLastWarning = { actions: [] };
m12.onEnd = {
  actions: [
    vo("All three critical components verified. The shift feeder assembly is confirmed operational and ready for final testing."),
  ],
};

fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({ converted: ['M1 Fixed Component Inspection', 'M12 Verification Tour'] }, null, 2));
