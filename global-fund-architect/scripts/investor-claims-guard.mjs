import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  forbiddenTerms,
  offerLikeTerms,
  requiredDisclaimers,
  hasNonOfferFraming
} from './lib/claim-rules.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');

const truthPath = path.join(repoRoot, 'truth', 'gnco.truth.json');
const distDir = path.join(appRoot, 'dist');
const docsDir = path.join(appRoot, 'docs');
const jurisdictionDir = path.join(appRoot, 'public', 'data', 'jurisdictions');

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

const allowedPrimarySourceDomains = new Set([
  'eur-lex.europa.eu',
  'ec.europa.eu',
  'fca.org.uk',
  'legislation.gov.uk',
  'sec.gov',
  'cftc.gov',
  'finra.org',
  'cssf.lu',
  'legilux.public.lu',
  'centralbank.ie',
  'cysec.gov.cy',
  'cylaw.org',
  'mfsa.mt',
  'afm.nl',
  'wetten.overheid.nl',
  'finma.ch',
  'fedlex.admin.ch',
  'mas.gov.sg',
  'sso.agc.gov.sg',
  'sfc.hk',
  'elegislation.gov.hk',
  'cima.ky',
  'dfsa.ae',
  'difc.ae',
  'adgm.com',
  'legislation.mt'
]);

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
};

const resolveDeployDir = () => {
  if (fs.existsSync(distDir)) return { dir: distDir, label: 'dist' };
  if (fs.existsSync(docsDir)) return { dir: docsDir, label: 'docs' };
  fail('Missing deploy output directory. Expected dist/ or docs/ after build.');
  return null;
};

const escapeRegex = (value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const genericPerformanceTerms = new Set(['returns', 'yield', 'profit']);
const financialContextPattern =
  /\b(apy|roi|invest(?:ment|or)?|fund|portfolio|performance|offering|solicitation|annual|monthly|guarante(?:ed|e))\b/i;

const isMaterialTermUse = (term, scannable, matchIndex, termLength) => {
  if (!genericPerformanceTerms.has(term.toLowerCase())) return true;
  const before = Math.max(0, matchIndex - 80);
  const after = Math.min(scannable.length, matchIndex + termLength + 80);
  const window = scannable.slice(before, after);
  return financialContextPattern.test(window);
};

const collectArtifacts = (rootDir, out = []) => {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) collectArtifacts(fullPath, out);
    if (entry.isFile() && /\.(html|js|css)$/i.test(entry.name))
      out.push(fullPath);
  }
  return out;
};

const scannableContentFor = (artifactPath, content) => {
  if (path.extname(artifactPath).toLowerCase() !== '.js') return content;
  const segments = [];
  const literalPattern = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g;
  let match;
  while ((match = literalPattern.exec(content)) !== null)
    segments.push(match[2]);
  return segments.join('\n');
};

const validateTruth = () => {
  if (!fs.existsSync(truthPath)) {
    fail('Missing truth/gnco.truth.json.');
    return;
  }

  const truth = JSON.parse(fs.readFileSync(truthPath, 'utf8'));
  for (const key of requiredKeys) {
    if (!(key in truth)) fail(`truth schema error: missing key ${key}`);
  }
  if (!['Prototype', 'Beta', 'Live'].includes(truth.status))
    fail('truth.status must be Prototype, Beta, or Live.');
};

const validateJurisdictionSources = () => {
  if (!fs.existsSync(jurisdictionDir)) {
    fail('Missing public/data/jurisdictions directory.');
    return;
  }

  const files = fs
    .readdirSync(jurisdictionDir)
    .filter((file) => file.endsWith('.json') && file !== 'manifest.json');
  for (const file of files) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(jurisdictionDir, file), 'utf8')
    );

    if (
      !payload.last_verified ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.last_verified)
    ) {
      fail(`${file} must include last_verified in YYYY-MM-DD format.`);
    }

    if (
      !Array.isArray(payload.primary_sources) ||
      payload.primary_sources.length === 0
    ) {
      fail(`${file} must include non-empty primary_sources.`);
      continue;
    }

    for (const source of payload.primary_sources) {
      if (!source?.url || source.url.includes('...')) {
        fail(`${file} contains placeholder or empty primary source URL.`);
        continue;
      }

      const domain = new URL(source.url).hostname.replace(/^www\./, '');
      if (!allowedPrimarySourceDomains.has(domain)) {
        fail(`${file} primary source domain is not allowlisted: ${domain}`);
      }
    }
  }
};

validateTruth();
validateJurisdictionSources();

const deploy = resolveDeployDir();
if (!deploy) process.exit(1);

for (const page of ['index.html', 'investor.html', 'disclosures.html']) {
  if (!fs.existsSync(path.join(deploy.dir, page)))
    fail(`Missing required output page: ${deploy.label}/${page}`);
}

const indexPath = path.join(deploy.dir, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  if (!/<div\s+id=["']root["']/.test(indexHtml))
    fail('dist/index.html must contain <div id="root">.');
  if (!/<script\b[^>]*>/.test(indexHtml))
    fail('dist/index.html must contain at least one <script> tag.');
}

const artifactPaths = collectArtifacts(deploy.dir);
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
      if (!isMaterialTermUse(term, scannable, match.index, match[0].length))
        continue;
      const context = scannable
        .slice(Math.max(0, match.index - 90), match.index)
        .toLowerCase();
      if (!/\b(no|not|without|never|non)\b/.test(context)) {
        fail(
          `Forbidden investor-claim term "${term}" found in ${deploy.label}/${relativeArtifactPath} without explicit negation.`
        );
        break;
      }
    }
  }

  for (const term of offerLikeTerms) {
    const regex = new RegExp(escapeRegex(term), 'gi');
    let match;
    while ((match = regex.exec(scannable)) !== null) {
      const context = scannable.slice(
        Math.max(0, match.index - 120),
        Math.min(scannable.length, match.index + term.length + 120)
      );
      if (!hasNonOfferFraming(context)) {
        fail(
          `Offer-like claim "${term}" found in ${deploy.label}/${relativeArtifactPath} without non-offer framing.`
        );
        break;
      }
    }
  }
}

for (const disclaimer of requiredDisclaimers) {
  if (!disclaimer.checks.every((pattern) => pattern.test(allContent))) {
    fail(`Missing required disclaimer coverage for: ${disclaimer.label}.`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('✅ Investor claims guard checks passed.');
