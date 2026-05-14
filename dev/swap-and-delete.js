const fs = require('fs');
const filePath = 'C:\\Users\\jasim\\Downloads\\VrseBuilderJSON_jasim@autovrse.in (44).json';
const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const ch0 = story.chapters[0];
const ch1 = story.chapters[1];
const ch2 = story.chapters[2];

// --- SWAP Ch0[2] with Ch1[1] ---
const m_ch0_2 = ch0.moments[2]; // Echoes of Melody
const m_ch1_1 = ch1.moments[1]; // Nurturing the Bloom

console.log(`Swapping:`);
console.log(`  Ch0[2] "${m_ch0_2.name}" (momentIndex ${m_ch0_2.momentIndex})`);
console.log(`  Ch1[1] "${m_ch1_1.name}" (momentIndex ${m_ch1_1.momentIndex})`);

ch0.moments[2] = m_ch1_1;
ch1.moments[1] = m_ch0_2;

// Fix momentIndex to match new positions
ch0.moments[2].momentIndex = 2;
ch1.moments[1].momentIndex = 1;

console.log(`After swap:`);
console.log(`  Ch0[2] = "${ch0.moments[2].name}" (momentIndex ${ch0.moments[2].momentIndex})`);
console.log(`  Ch1[1] = "${ch1.moments[1].name}" (momentIndex ${ch1.moments[1].momentIndex})`);

// --- DELETE Ch2[0] and Ch2[1] ---
console.log(`\nDeleting from Ch2:`);
console.log(`  Ch2[0] = "${ch2.moments[0].name}"`);
console.log(`  Ch2[1] = "${ch2.moments[1].name}"`);
console.log(`  Keeping: "${ch2.moments[2].name}"`);

ch2.moments.splice(0, 2);

// Fix momentIndex for surviving moment
ch2.moments[0].momentIndex = 0;

console.log(`Ch2 after deletion:`);
ch2.moments.forEach((m, i) => console.log(`  Ch2[${i}] = "${m.name}" (momentIndex ${m.momentIndex})`));

fs.writeFileSync(filePath, JSON.stringify(story, null, 2), 'utf8');
console.log('\nFile written successfully.');
