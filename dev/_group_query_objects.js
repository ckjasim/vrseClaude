const fs = require('fs');
const p = 'C:/Users/jasim/.claude/projects/C--autovrse-jsonClaw/add5bfe2-d896-4fb0-83e8-ea850c62db81/tool-results/toolu_bdrk_01LYn7EcSaR523iwz8dm8wX3.json';
const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
const payload = JSON.parse(raw[0].text);
const objs = payload.data.queryObjects;

console.log('Total query objects:', objs.length);

// Deduplicate by id + gameObjectPath combo (the inspect showed duplicates in default bucket)
const seen = new Set();
const unique = [];
for (const o of objs) {
  const k = o.id + '|' + o.gameObjectPath;
  if (seen.has(k)) continue;
  seen.add(k);
  unique.push(o);
}
console.log('Unique after dedup by id+path:', unique.length);

// Extract bucket — everything up to (but not including) the last segment
function bucketOf(p) {
  // QueryObjects/#h1 Story Objects/#h2 Interactables/#h4 Chapter 1/Lever/LeverHandle
  // bucket = QueryObjects/#h1 Story Objects/#h2 Interactables/#h4 Chapter 1
  // but sometimes there are nested folders we want to group differently.
  // The user wants to group by the folder-like "#h" prefixes.
  // Strategy: walk the path and find the deepest prefix ending in a segment starting with "#h"
  const parts = p.split('/');
  let lastHashIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('#h')) lastHashIdx = i;
  }
  if (lastHashIdx < 0) return parts.slice(0, Math.max(1, parts.length - 1)).join('/');
  return parts.slice(0, lastHashIdx + 1).join('/');
}

const buckets = new Map();
for (const o of unique) {
  const b = bucketOf(o.gameObjectPath);
  if (!buckets.has(b)) buckets.set(b, []);
  buckets.get(b).push(o);
}

// Sort bucket keys for readable output
const keys = [...buckets.keys()].sort();

console.log('\n=== BUCKETS (' + keys.length + ') ===');
for (const k of keys) {
  console.log(buckets.get(k).length.toString().padStart(4) + '  ' + k);
}

// Emit full grouped listing
const out = [];
out.push('TOTAL OBJECTS: ' + unique.length + ' unique (raw count ' + objs.length + ')');
out.push('BUCKETS: ' + keys.length);
out.push('');
out.push('== BUCKET SUMMARY ==');
for (const k of keys) {
  out.push(buckets.get(k).length.toString().padStart(4) + '  ' + k);
}
out.push('');
out.push('== DETAILED LISTING ==');
for (const k of keys) {
  out.push('');
  out.push('### ' + k + '  (' + buckets.get(k).length + ' objects)');
  const items = buckets.get(k).slice().sort((a, b) => a.gameObjectName.localeCompare(b.gameObjectName));
  for (const o of items) {
    const ref = o.queryName && o.queryName.length > 0 ? o.queryName : o.gameObjectName;
    const comps = (o.vrseComponents || []).join(',') || '-';
    const queryMarker = o.queryName && o.queryName.length > 0 ? 'Q' : 'N'; // Q=queryName, N=name only
    out.push(`  [${queryMarker}] ${ref}  |  go=${o.gameObjectName}  |  comps=${comps}`);
  }
}

fs.writeFileSync('C:/autovrse/jsonClaw/dev/_grouped_query_objects.txt', out.join('\n'));
console.log('\nWrote _grouped_query_objects.txt');

// Also emit raw unique listing as JSON for later scripts
fs.writeFileSync('C:/autovrse/jsonClaw/dev/_unique_query_objects.json', JSON.stringify(unique, null, 2));
