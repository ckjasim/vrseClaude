// Find SFX actions still pointing at GENERATE_THIS.com so we know exactly which moments
// and paths still need human attention.
const fs = require('fs');
const path = 'C:/autovrse/jsonClaw/stories/Assembly_Training.json';
const story = JSON.parse(fs.readFileSync(path, 'utf8'));

const hits = [];

function walk(node, pathSegs) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, pathSegs.concat(`[${i}]`)));
    return;
  }

  // Detect SFX action nodes: Name === "SFXPlayer" OR Query === "SFXPlayer" with a Data field
  if ((node.Name === 'SFXPlayer' || node.Query === 'SFXPlayer') && typeof node.Data === 'string') {
    try {
      const data = JSON.parse(node.Data);
      if (data && typeof data === 'object') {
        const url = data.audioUrl || data.AudioUrl;
        const clip = data.audioClipName || data.AudioClipName;
        if (!url || /GENERATE_THIS/.test(url) || !clip) {
          hits.push({
            path: pathSegs.join('.'),
            Name: node.Name,
            Option: node.Option,
            Query: node.Query,
            audioUrl: url,
            audioClipName: clip,
            data,
          });
        }
      }
    } catch (e) {
      hits.push({ path: pathSegs.join('.'), error: 'Data not valid JSON', Data: node.Data });
    }
  }

  for (const k of Object.keys(node)) {
    walk(node[k], pathSegs.concat(k));
  }
}

walk(story, []);

console.log(`Found ${hits.length} orphan/incomplete SFX nodes:\n`);
hits.forEach((h, i) => {
  console.log(`[${i}] ${h.path}`);
  console.log(JSON.stringify(h, null, 2));
  console.log('---');
});
