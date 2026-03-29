import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const strictMode = process.argv.includes('--strict');
const localesDir = join(process.cwd(), 'src', 'locales');
const baselineFile = join(localesDir, 'en.ts');

const extractKeys = (content) => {
  const regex = /"([^"]+)"\s*:/g;
  const keys = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
};

const baselineContent = readFileSync(baselineFile, 'utf8');
const baselineKeys = extractKeys(baselineContent);

const files = readdirSync(localesDir).filter((f) => f.endsWith('.ts')).sort();

const report = [];
let hasMismatch = false;

for (const file of files) {
  const fullPath = join(localesDir, file);
  const content = readFileSync(fullPath, 'utf8');
  const keys = extractKeys(content);

  const missing = [...baselineKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baselineKeys.has(k));

  if (missing.length > 0 || extra.length > 0) {
    hasMismatch = true;
  }

  report.push({
    file,
    total: keys.size,
    missing: missing.length,
    extra: extra.length,
    sampleMissing: missing.slice(0, 5),
    sampleExtra: extra.slice(0, 5)
  });
}

console.log(`Locale baseline: en.ts (${baselineKeys.size} keys)`);
for (const row of report) {
  console.log(`${row.file}: keys=${row.total} missing=${row.missing} extra=${row.extra}`);
  if (row.sampleMissing.length > 0) {
    console.log(`  missing sample: ${row.sampleMissing.join(', ')}`);
  }
  if (row.sampleExtra.length > 0) {
    console.log(`  extra sample: ${row.sampleExtra.join(', ')}`);
  }
}

if (strictMode && hasMismatch) {
  console.error('Locale key mismatch detected in strict mode.');
  process.exit(1);
}
