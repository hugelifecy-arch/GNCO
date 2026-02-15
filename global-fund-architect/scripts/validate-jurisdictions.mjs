import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(
  __dirname,
  '..',
  'public',
  'data',
  'jurisdictions'
);
const manifestPath = path.join(dataDir, 'manifest.json');

const statusAllowed = new Set(['Supported', 'Partial', 'Planned']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const requiredKeys = [
  'code',
  'name',
  'status',
  'last_verified',
  'scope_notes',
  'primary_sources',
  'regimes',
  'marketing_notes',
  'licensing_notes',
  'tokenization_notes',
  'crypto_financing_notes',
  'risk_flags'
];

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
};

if (!fs.existsSync(manifestPath)) {
  fail('Missing manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.jurisdictions)) {
  fail('manifest.jurisdictions must be an array');
  process.exit(1);
}

for (const entry of manifest.jurisdictions) {
  if (!entry.code) {
    fail('Manifest entry missing code');
    continue;
  }

  const filePath = path.join(dataDir, `${entry.code}.json`);
  if (!fs.existsSync(filePath)) {
    fail(`Missing jurisdiction file: ${entry.code}.json`);
    continue;
  }

  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const key of requiredKeys) {
    if (!(key in obj)) fail(`${entry.code}.json missing required key: ${key}`);
  }

  if (obj.code !== entry.code) fail(`${entry.code}.json code mismatch`);
  if (!statusAllowed.has(obj.status))
    fail(`${entry.code}.json invalid status: ${obj.status}`);
  if (!datePattern.test(obj.last_verified))
    fail(`${entry.code}.json invalid last_verified format`);

  if (!Array.isArray(obj.primary_sources) || obj.primary_sources.length === 0) {
    fail(`${entry.code}.json primary_sources must be a non-empty array`);
  } else {
    for (const [idx, source] of obj.primary_sources.entries()) {
      if (!source?.label || !source?.url)
        fail(
          `${entry.code}.json primary_sources[${idx}] must contain label and url`
        );
      if (typeof source.url !== 'string' || !source.url.startsWith('https://'))
        fail(
          `${entry.code}.json primary_sources[${idx}] url must start with https://`
        );
      if (source.url.includes('...'))
        fail(
          `${entry.code}.json primary_sources[${idx}] contains placeholder URL`
        );
    }
  }

  if (obj.status === 'Supported' || obj.status === 'Partial') {
    const hasRegime = Array.isArray(obj.regimes) && obj.regimes.length >= 1;
    const hasJustification =
      typeof obj.scope_notes === 'string' &&
      /regimes?\s*(not\s+listed|not\s+included|n\/a|not\s+applicable|justification)/i.test(
        obj.scope_notes
      );
    if (!hasRegime && !hasJustification) {
      fail(
        `${obj.code}.json must have regimes[] >= 1 for Supported/Partial (or justify in scope_notes).`
      );
    }
  }

  for (const field of [
    'regimes',
    'marketing_notes',
    'licensing_notes',
    'tokenization_notes',
    'crypto_financing_notes',
    'risk_flags'
  ]) {
    if (!Array.isArray(obj[field]))
      fail(`${entry.code}.json ${field} must be an array`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('✅ Jurisdiction validation passed.');
