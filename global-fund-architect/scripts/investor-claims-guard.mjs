import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');

const truthPath = path.join(repoRoot, 'truth', 'gnco.truth.json');
const distDir = path.join(appRoot, 'dist');
const docsDir = path.join(appRoot, 'docs');
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

const forbiddenTerms = ['APY', 'ROI', 'returns', 'yield', 'guaranteed', 'risk-free', 'profit'];

const requiredDisclaimers = [
  {
    label: 'not an offer / not investment advice',
    checks: [/not\s+an\s+offer/i, /not\s+investment\s+advice/i]
  },
  {
    label: 'prototype / informational',
    checks: [/prototype/i, /informational\s+only/i]
  },
  {
    label: 'verify with qualified professionals',
    checks: [/(verify|validated?|confirm)\s+with\s+(qualified\s+)?(professionals?|counsel|advisors?)/i]
  }
];

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
};

const listDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return '(missing)';
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  if (entries.length === 0) {
    return '(empty)';
  }

  return entries.map((entry) => `${entry.isDirectory() ? 'd' : '-'} ${entry.name}`).join('\n');
};

const resolveDeployDir = () => {
  if (fs.existsSync(distDir)) {
    return { dir: distDir, label: 'dist' };
  }

  if (fs.existsSync(docsDir)) {
    return { dir: docsDir, label: 'docs' };
  }

  fail([
    'Missing deploy output directory. Expected dist/ or docs/ after build.',
    `- dist/:\n${listDir(distDir)}`,
    `- docs/:\n${listDir(docsDir)}`
  ].join('\n'));
  return null;
};

const escapeRegex = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const genericPerformanceTerms = new Set(['returns', 'yield', 'profit']);
const financialContextPattern = /\b(apy|roi|invest(?:ment|or)?|fund|portfolio|performance|offering|solicitation|annual|monthly|guarante(?:ed|e))\b/i;

const isMaterialTermUse = (term, scannable, matchIndex, termLength) => {
  if (!genericPerformanceTerms.has(term.toLowerCase())) {
    return true;
  }

  const before = Math.max(0, matchIndex - 80);
  const after = Math.min(scannable.length, matchIndex + termLength + 80);
  const window = scannable.slice(before, after);
  return financialContextPattern.test(window);
};

const collectArtifacts = (rootDir, out = []) => {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      collectArtifacts(fullPath, out);
      continue;
    }

    if (/\.(html|js|css)$/i.test(entry.name)) {
      out.push(fullPath);
    }
  }

  return out;
};

const scannableContentFor = (artifactPath, content) => {
  const ext = path.extname(artifactPath).toLowerCase();

  if (ext !== '.js') {
    return content;
  }

  const segments = [];
  const literalPattern = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g;
  let match;

  while ((match = literalPattern.exec(content)) !== null) {
    segments.push(match[2]);
  }

  return segments.join('\n');
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

const deploy = resolveDeployDir();
if (!deploy) {
  process.exit(process.exitCode ?? 1);
}

process.stdout.write(`ℹ️ Scanning deploy output in ${deploy.label}/\n`);

for (const page of ['investor.html', 'disclosures.html']) {
  if (!fs.existsSync(path.join(deploy.dir, page))) {
    fail(`Missing required output page: ${deploy.label}/${page}`);
  }
}

const artifactPaths = collectArtifacts(deploy.dir);
if (artifactPaths.length === 0) {
  fail(`No .html/.js/.css build artifacts found in ${deploy.label}/.`);
}

let allContent = '';
for (const artifactPath of artifactPaths) {
  const relativeArtifactPath = path.relative(deploy.dir, artifactPath);
  const content = fs.readFileSync(artifactPath, 'utf8');
  const scannable = scannableContentFor(artifactPath, content);
  allContent += `\n${scannable}`;

  for (const term of forbiddenTerms) {
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
    let match;

    while ((match = regex.exec(scannable)) !== null) {
      if (!isMaterialTermUse(term, scannable, match.index, match[0].length)) {
        continue;
      }

      const contextStart = Math.max(0, match.index - 60);
      const context = scannable.slice(contextStart, match.index).toLowerCase();
      const isNegated = /\b(no|not|without|never|non)\b/.test(context);

      if (!isNegated) {
        fail(`Forbidden investor-claim term "${term}" found in ${deploy.label}/${relativeArtifactPath} without explicit negation.`);
        break;
      }
    }
  }
}

for (const disclaimer of requiredDisclaimers) {
  const complete = disclaimer.checks.every((pattern) => pattern.test(allContent));
  if (!complete) {
    fail(`Missing required disclaimer coverage for: ${disclaimer.label}.`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

process.stdout.write('✅ Investor claims guard checks passed.\n');
