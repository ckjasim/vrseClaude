const fs = require('fs');

const filePath = 'C:\\Users\\jasim\\Downloads\\VrseBuilderJSON_jasim@autovrse.in (44).json';
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const moments = story.chapters[0].moments;

if (moments.length < 2) {
  console.error('Chapter 0 has fewer than 2 moments — nothing to swap.');
  process.exit(1);
}

// Swap the two moment objects
[moments[0], moments[1]] = [moments[1], moments[0]];

// Fix momentIndex to match new positions
moments[0].momentIndex = 0;
moments[1].momentIndex = 1;

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');

console.log('Swapped:');
console.log('  Position 0 →', moments[0].name, '(was momentIndex', moments[0].momentIndex, ')');
console.log('  Position 1 →', moments[1].name, '(was momentIndex', moments[1].momentIndex, ')');
console.log('Done.');
