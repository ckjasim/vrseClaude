// Replaces all SFXPlayer audioUrl values that are not real ElevenLabs URLs
// with GENERATE_THIS.com so generate_sfx can resolve them.
const fs = require('fs');
const path = require('path');

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node stamp-generate-this.js <file1.json> [file2.json ...]');
  process.exit(1);
}

const PLACEHOLDER = 'https://GENERATE_THIS.com';
// Real URLs will contain elevenlabs or the known real CDN prefix after generation
const REAL_URL_PATTERNS = [/elevenlabs\.io/, /eleven\.io/, /GENERATE_THIS/];

function isAlreadyReal(url) {
  if (!url) return false;
  return REAL_URL_PATTERNS.some(p => p.test(url));
}

function walkActions(actions, count) {
  if (!Array.isArray(actions)) return count;
  for (const action of actions) {
    if (action.Query === 'SFXPlayer' && typeof action.Data === 'string') {
      try {
        const data = JSON.parse(action.Data);
        if (data.audioUrl !== undefined && !isAlreadyReal(data.audioUrl)) {
          data.audioUrl = PLACEHOLDER;
          action.Data = JSON.stringify(data);
          count++;
        }
      } catch (e) { /* skip malformed Data */ }
    }
  }
  return count;
}

function walkMoment(moment, count) {
  const simpleSections = ['onAwake', 'onStart', 'onEnd', 'onFirstWarning', 'onLastWarning'];
  for (const sec of simpleSections) {
    count = walkActions(moment[sec]?.actions, count);
  }
  for (const tas of moment.onRight?.triggerActionSets ?? []) {
    count = walkActions(tas.actions, count);
  }
  for (const tas of moment.onWrong ?? []) {
    count = walkActions(tas.actions, count);
  }
  return count;
}

for (const target of targets) {
  const filePath = path.resolve(target);
  const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let total = 0;
  for (const chapter of story.chapters ?? []) {
    for (const moment of chapter.moments ?? []) {
      total = walkMoment(moment, total);
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
  console.log(`${path.basename(filePath)}: stamped ${total} audioUrl(s) with GENERATE_THIS.com`);
}
