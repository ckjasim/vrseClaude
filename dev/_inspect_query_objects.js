const fs = require('fs');
const p = 'C:/Users/jasim/.claude/projects/C--autovrse-jsonClaw/add5bfe2-d896-4fb0-83e8-ea850c62db81/tool-results/toolu_bdrk_01LYn7EcSaR523iwz8dm8wX3.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
console.log('Type:', typeof data, 'isArray:', Array.isArray(data));
if (Array.isArray(data)) {
  console.log('Array length:', data.length);
  console.log('First item keys:', Object.keys(data[0] || {}));
  console.log('First item:', JSON.stringify(data[0], null, 2));
} else {
  console.log('Top keys:', Object.keys(data));
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (Array.isArray(v)) {
      console.log(k, 'is array of', v.length);
      if (v.length > 0) console.log('  first:', JSON.stringify(v[0], null, 2).slice(0, 800));
    } else if (typeof v === 'object' && v !== null) {
      console.log(k, 'is object with keys', Object.keys(v));
    } else {
      console.log(k, '=', v);
    }
  }
}
