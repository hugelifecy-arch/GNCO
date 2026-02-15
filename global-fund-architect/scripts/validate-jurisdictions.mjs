import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'public', 'data', 'jurisdictions');
const manifestPath = path.join(dataDir, 'manifest.json');

const statusAllowed = new Set(['Supported', 'Partial', 'Planned']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

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
  const code = entry.code;
  const filePath = path.join(dataDir, `${code}.json`);
  if (!code) {
    fail('Manifest entry missing code');
    continue;
  }
  if (!fs.existsSync(filePath)) {
    fail(`Missing jurisdiction file: ${code}.json`);
    continue;
  }

  const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const key of ['code', 'name', 'status', 'last_verified', 'primary_sources', 'marketing_notes', 'requires_counsel_triggers']) {
    if (!(key in obj)) fail(`${code}.json missing required key: ${key}`);
  }

  if (obj.code !== code) fail(`${code}.json code mismatch`);
  if (!statusAllowed.has(obj.status)) fail(`${code}.json invalid status: ${obj.status}`);
  if (!datePattern.test(obj.last_verified)) fail(`${code}.json invalid last_verified format`);

  if (!Array.isArray(obj.primary_sources)) {
    fail(`${code}.json primary_sources must be an array`);
  } else {
    if ((obj.status === 'Supported' || obj.status === 'Partial') && obj.primary_sources.length === 0) {
      fail(`${code}.json primary_sources cannot be empty for ${obj.status}`);
    }
    for (const [idx, source] of obj.primary_sources.entries()) {
      if (!source || typeof source !== 'object') {
        fail(`${code}.json primary_sources[${idx}] must be an object`);
        continue;
      }
      if (!source.title || !source.url) {
        fail(`${code}.json primary_sources[${idx}] must contain title and url`);
      }
      if (typeof source.url !== 'string' || !source.url.startsWith('https://')) {
        fail(`${code}.json primary_sources[${idx}] url must start with https://`);
      }
    }
  }

  if (!Array.isArray(obj.marketing_notes)) fail(`${code}.json marketing_notes must be an array`);
  if (!Array.isArray(obj.requires_counsel_triggers)) fail(`${code}.json requires_counsel_triggers must be an array`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('✅ Jurisdiction validation passed.');
