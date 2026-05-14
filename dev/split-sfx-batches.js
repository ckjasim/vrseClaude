// Splits the _sfx-seed.json into batches of N moments each,
// writing one seed file per batch under stories/_sfx-batch-N.json
const fs = require('fs');
const path = require('path');

const BATCH_SIZE = parseInt(process.argv[2] ?? '4', 10);
const seedPath = path.resolve(__dirname, '../stories/_sfx-seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const moments = seed.chapters[0].moments;
const batches = [];
for (let i = 0; i < moments.length; i += BATCH_SIZE) {
  batches.push(moments.slice(i, i + BATCH_SIZE));
}

batches.forEach((batch, idx) => {
  const batchStory = {
    name: `SFX Seed Batch ${idx + 1}`,
    chapters: [{
      name: 'SFX',
      moments: batch.map((m, i) => ({ ...m, momentIndex: i }))
    }]
  };
  const outPath = path.resolve(__dirname, `../stories/_sfx-batch-${idx + 1}.json`);
  fs.writeFileSync(outPath, JSON.stringify(batchStory, null, 2), 'utf8');
  console.log(`Batch ${idx + 1}: ${batch.map(m => m.name).join(', ')} → ${path.basename(outPath)}`);
});

console.log(`\n${batches.length} batch files written (batch size: ${BATCH_SIZE})`);
