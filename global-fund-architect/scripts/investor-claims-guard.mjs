import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');

const truthPath = path.join(repoRoot, 'truth', 'gnco.truth.json');
const distDir = path.join(appRoot, 'dist');
const requiredKeys = [
  'projectName',
  'status',
  'whatItIs',
  'whatItIsNot',
  'featuresNow',
  'featuresPlanned',
  'riskDisclosureBullets',
  'lastUpdated',
  'version'
];

const forbiddenTerms = [
  'guaranteed',
  'risk-free',
  'fixed return',
  'APY',
  'ROI',
  'profit',
  'assured',
  'insured returns'
];

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(truthPath)) {
  fail('Missing truth/gnco.truth.json.');
} else {
  const truth = JSON.parse(fs.readFileSync(truthPath, 'utf8'));

  for (const key of requiredKeys) {
    if (!(key in truth)) {
      fail(`truth schema error: missing key ${key}`);
    }
  }

  if (!['Prototype', 'Beta', 'Live'].includes(truth.status)) {
    fail('truth.status must be Prototype, Beta, or Live.');
  }

  if (truth.status === 'Live') {
    const productionFlag = process.env.PRODUCTION === 'true';
    const tag = process.env.GITHUB_REF_TYPE === 'tag' || /^refs\/tags\//.test(process.env.GITHUB_REF ?? '');
    if (!productionFlag || !tag) {
      fail('truth.status cannot be Live unless PRODUCTION=true and the build runs on a release tag.');
    }
  }
}

for (const fileName of ['investor.html', 'disclosures.html']) {
  const pagePath = path.join(distDir, fileName);
  if (!fs.existsSync(pagePath)) {
    fail(`Missing required output page: dist/${fileName}`);
    continue;
  }

  const content = fs.readFileSync(pagePath, 'utf8');
  const lowered = content.toLowerCase();

  for (const term of forbiddenTerms) {
    const termLower = term.toLowerCase();
    let cursor = lowered.indexOf(termLower);

    while (cursor !== -1) {
      const contextStart = Math.max(0, cursor - 25);
      const context = lowered.slice(contextStart, cursor);
      const isNegated = /\b(no|not|without)\b/.test(context);

      if (!isNegated) {
        fail(`Forbidden investor-claim term "${term}" found in dist/${fileName} without explicit negation.`);
        break;
      }

      cursor = lowered.indexOf(termLower, cursor + termLower.length);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('✅ Investor claims guard checks passed.');
