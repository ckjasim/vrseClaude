// Collects all unique audioClipName values from multiple story files
// and writes a minimal seed story JSON with one SFXPlayer action per unique clip.
// generate_sfx is then called on this seed to get real URLs, one per clip.
const fs = require('fs');
const path = require('path');

const targets = process.argv.slice(2).filter(a => !a.startsWith('--'));
const outFlag = process.argv.indexOf('--out');
const outPath = outFlag !== -1 ? process.argv[outFlag + 1] : path.resolve(__dirname, '../stories/_sfx-seed.json');

const seen = new Map(); // clipName -> first audioClipName occurrence data

for (const target of targets) {
  const story = JSON.parse(fs.readFileSync(path.resolve(target), 'utf8'));

  function walkActions(actions) {
    if (!Array.isArray(actions)) return;
    for (const a of actions) {
      if (a.Query === 'SFXPlayer' && typeof a.Data === 'string') {
        try {
          const d = JSON.parse(a.Data);
          if (d.audioClipName && !seen.has(d.audioClipName)) {
            seen.set(d.audioClipName, { audioClipName: d.audioClipName, audioRange: d.audioRange ?? 10, setVolume: d.setVolume ?? 0.7 });
          }
        } catch {}
      }
    }
  }

  function walkMoment(m) {
    for (const sec of ['onAwake','onStart','onEnd','onFirstWarning','onLastWarning']) walkActions(m[sec]?.actions);
    for (const tas of m.onRight?.triggerActionSets ?? []) walkActions(tas.actions);
    for (const tas of m.onWrong ?? []) walkActions(tas.actions);
  }

  for (const ch of story.chapters ?? []) for (const m of ch.moments ?? []) walkMoment(m);
}

const clips = [...seen.values()];
console.log(`Unique SFX clips: ${clips.length}`);
clips.forEach(c => console.log(' -', c.audioClipName));

// Build a minimal single-chapter story with one moment per clip
const seed = {
  name: "SFX Seed",
  chapters: [{
    name: "SFX",
    moments: clips.map((c, i) => ({
      name: c.audioClipName,
      description: c.audioClipName,
      momentIndex: i,
      onAwake: { actions: [] },
      onStart: {
        actions: [{
          Query: "SFXPlayer",
          Name: "SFXPlayer",
          Option: "Play",
          Data: JSON.stringify({
            audioClipName: c.audioClipName,
            useCloudAudio: true,
            audioUrl: "https://GENERATE_THIS.com",
            audioRange: c.audioRange,
            setVolume: c.setVolume,
            waitForCompletion: false
          })
        }]
      },
      onRight: { mode: "InOrder", triggerActionSets: [] },
      onWrong: [],
      onFirstWarning: { actions: [] },
      onLastWarning: { actions: [] },
      onEnd: { actions: [] }
    }))
  }]
};

fs.writeFileSync(outPath, JSON.stringify(seed, null, 2), 'utf8');
console.log(`Seed story written: ${outPath} (${clips.length} moments)`);
