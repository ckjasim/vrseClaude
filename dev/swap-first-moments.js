const fs = require('fs');
const filePath = 'C:\\Users\\jasim\\Downloads\\VrseBuilderJSON_jasim@autovrse.in (44).json';

const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const ch0 = story.chapters[0];
const ch1 = story.chapters[1];

const m0 = ch0.moments[0]; // The First Spark
const m1 = ch1.moments[0]; // The Turning of the Gears

console.log(`Swapping:`);
console.log(`  Chapter[0].moments[0] = "${m0.name}" (momentIndex: ${m0.momentIndex})`);
console.log(`  Chapter[1].moments[0] = "${m1.name}" (momentIndex: ${m1.momentIndex})`);

// Swap — momentIndex stays 0 for both since both are first in their chapter
ch0.moments[0] = m1;
ch1.moments[0] = m0;

// Verify momentIndex consistency (both are already 0, no change needed)
console.log(`After swap:`);
console.log(`  Chapter[0].moments[0] = "${ch0.moments[0].name}" (momentIndex: ${ch0.moments[0].momentIndex})`);
console.log(`  Chapter[1].moments[0] = "${ch1.moments[0].name}" (momentIndex: ${ch1.moments[0].momentIndex})`);

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
console.log('File written successfully.');
