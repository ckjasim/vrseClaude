const fs = require('fs');
const filePath = 'C:\\Users\\jasim\\Downloads\\VrseBuilderJSON_jasim@autovrse.in (44).json';
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Top-level keys:', JSON.stringify(Object.keys(story)));

if (story.chapters) {
  console.log('chapters is an array:', Array.isArray(story.chapters));
  console.log('chapter count:', story.chapters.length);
  story.chapters.forEach((ch, i) => {
    const keys = Object.keys(ch);
    const momentCount = ch.moments ? ch.moments.length : 'no moments key';
    console.log(`Chapter[${i}] keys: ${JSON.stringify(keys)}, moments: ${momentCount}`);
    if (ch.moments && ch.moments.length > 0) {
      const m = ch.moments[0];
      console.log(`  Chapter[${i}].moments[0] keys: ${JSON.stringify(Object.keys(m))}`);
      console.log(`  Chapter[${i}].moments[0].momentIndex: ${m.momentIndex}, name: ${m.name}`);
    }
  });
} else {
  // Maybe flat moments array
  const keys = Object.keys(story);
  console.log('No chapters key. Looking for moments...');
  keys.forEach(k => {
    if (Array.isArray(story[k])) {
      console.log(`Key "${k}" is array of length ${story[k].length}`);
    }
  });
}
