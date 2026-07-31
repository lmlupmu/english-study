const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', '英语学习网站', 'src', 'data', 'vocab', 'grades7-9.ts');

function fmt(w, p, m, s, e, t) {
  return `    { word: '${w}', phonetic: '${p}', meaning: '${m}', partOfSpeech: '${s}', example: '${e}', translation: '${t}', difficulty: 3 },`;
}

const g7Data = require('./data-g7');
const g8Data = require('./data-g8');
const g9Data = require('./data-g9');

const seen = new Set();
const g7 = g7Data.filter(d => {
  if (seen.has(d[0])) return false;
  seen.add(d[0]);
  return true;
}).map(d => fmt(...d));

seen.clear();
const g8 = g8Data.filter(d => {
  if (seen.has(d[0])) return false;
  seen.add(d[0]);
  return true;
}).map(d => fmt(...d));

seen.clear();
const g9 = g9Data.filter(d => {
  if (seen.has(d[0])) return false;
  seen.add(d[0]);
  return true;
}).map(d => fmt(...d));

const lines = [
  "import type { VocabularyItem } from '@/types'",
  '',
  'export const vocabGrades7to9: Record<number, VocabularyItem[]> = {',
  '  7: [',
  ...g7,
  '  ],',
  '  8: [',
  ...g8,
  '  ],',
  '  9: [',
  ...g9,
  '  ],',
  '};',
  ''
];

fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');

console.log(`Generated grades7-9.ts:`);
console.log(`  Grade 7: ${g7.length} entries`);
console.log(`  Grade 8: ${g8.length} entries`);
console.log(`  Grade 9: ${g9.length} entries`);
console.log(`  Total: ${g7.length + g8.length + g9.length} entries`);