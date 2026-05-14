// SFXPlayer/StopAndSkip actions do not play audio, so audioUrl on them is noise.
// Remove the audioUrl key from these actions' Data. Leave any other StopAndSkip
// params intact.
const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

let cleaned = 0;

function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(walk); return; }

  if (
    (node.Name === 'SFXPlayer' || node.Query === 'SFXPlayer') &&
    node.Option === 'StopAndSkip' &&
    typeof node.Data === 'string'
  ) {
    try {
      const data = JSON.parse(node.Data);
      if (data && typeof data === 'object' && typeof data.audioUrl === 'string' && /GENERATE_THIS/.test(data.audioUrl)) {
        delete data.audioUrl;
        delete data.audioClipName;
        delete data.useCloudAudio;
        node.Data = JSON.stringify(data);
        cleaned++;
      }
    } catch (e) {}
  }

  for (const k of Object.keys(node)) walk(node[k]);
}

walk(story);
fs.writeFileSync(path, JSON.stringify(story, null, 2), 'utf8');
console.log(JSON.stringify({ cleaned }, null, 2));
