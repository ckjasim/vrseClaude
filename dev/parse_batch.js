// Parse C# anonymous-object printouts into JSON, filter Interactables-only, drop components
const fs = require('fs');
const wrapper = JSON.parse(fs.readFileSync('C:/autovrse/jsonClaw/dev/batch_results_temp.json', 'utf8'));
const text = wrapper[0].text;
const outer = JSON.parse(text);
const rows = outer.data.result; // array of strings

function parseRow(s) {
  // s looks like: { name = X, path = Y, active = True, childCount = N, matchedKw = K, components = System.String[] }
  const m = s.match(/^\{\s*name\s*=\s*(.+?),\s*path\s*=\s*(.+?),\s*active\s*=\s*(True|False),\s*childCount\s*=\s*(\d+),\s*matchedKw\s*=\s*(.+?),\s*components\s*=\s*(.+?)\s*\}$/);
  if (!m) return null;
  return {
    name: m[1],
    path: m[2],
    active: m[3] === 'True',
    childCount: parseInt(m[4], 10),
    matchedKw: m[5],
  };
}

const parsed = [];
let failed = 0;
for (const row of rows) {
  const p = parseRow(row);
  if (p) parsed.push(p);
  else failed++;
}

console.log('Total rows:', rows.length, 'parsed:', parsed.length, 'failed:', failed);

// Interactables-only filter
const interactables = parsed.filter(o => o.path && o.path.includes('#h2  Interactables'));
console.log('Interactables-only:', interactables.length);

const compact = interactables.map(({ name, path, childCount, active }) => ({ name, path, childCount, active }));
fs.writeFileSync('C:/autovrse/jsonClaw/dev/batch_compact.json', JSON.stringify(compact, null, 2));
console.log('Written:', compact.length, 'objects to batch_compact.json');

// Also save all parsed (for debugging if needed)
const allCompact = parsed.map(({ name, path, childCount, active, matchedKw }) => ({ name, path, childCount, active, matchedKw }));
fs.writeFileSync('C:/autovrse/jsonClaw/dev/batch_all_compact.json', JSON.stringify(allCompact, null, 2));
console.log('All parsed (incl. non-interactables):', allCompact.length, 'to batch_all_compact.json');
