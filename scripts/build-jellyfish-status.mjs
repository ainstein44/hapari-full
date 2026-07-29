import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = process.argv[2];
const outputPath = process.argv[3];
const payload = JSON.parse(await readFile(sourcePath, 'utf8'));
const rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
const beaches = {
  haeundae: ['해운대', '해운대해수욕장'],
  gwangalli: ['광안리', '광안리해수욕장'],
  songjeong: ['송정', '송정해수욕장']
};
const pick = (row, keys) => {
  const actual = Object.keys(row).find(key => keys.includes(key.replace(/\s/g, '')));
  return actual ? String(row[actual] ?? '').trim() : '';
};
const locationOf = row => pick(row, ['해파리출현지역', '출현지역', '출현지', '지역', '장소']);
const speciesOf = row => pick(row, ['해파리코드명', '해파리명', '해파리종류', '종류', '종명']);
const dateOf = row => pick(row, ['작성일', '관측일시', '관측일', '등록일', '신고일']);
const countOf = row => Number(pick(row, ['해파리신고건수', '신고건수', '건수', '수량']).replace(/[^0-9.]/g, '')) || 1;
const result = { generatedAt: new Date().toISOString(), source: '국립수산과학원 해파리 신고', beaches: {} };
for (const [id, keywords] of Object.entries(beaches)) {
  const matches = rows.filter(row => keywords.some(word => locationOf(row).includes(word)));
  if (!matches.length) continue;
  const species = [...new Set(matches.map(speciesOf).filter(Boolean))].slice(0, 5);
  const dates = matches.map(dateOf).filter(Boolean).sort();
  result.beaches[id] = { available: true, count: matches.reduce((sum, row) => sum + countOf(row), 0), species, observedAt: dates.at(-1) || null };
}
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
