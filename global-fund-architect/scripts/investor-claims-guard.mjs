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
const jurisdictionDir = path.join(appRoot, 'public', 'data', 'jurisdictions');

const distDir = path.join(appRoot, 'dist');
const docsDir = path.join(appRoot, 'docs');

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
};

const resolveDeployDir = () => {
  if (fs.existsSync(distDir)) return { dir: distDir, label: 'dist' };
  if (fs.existsSync(docsDir)) return { dir: docsDir, label: 'docs' };
  fail('Missing deploy output directory. Expected dist/ or docs/ after build.');
  return null;
};

const escapeRegex = (v) => v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const collectFiles = (rootDir, out = []) => {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    if (entry.isFile() && /\.html$/i.test(entry.name)) out.push(full);
  }
  return out;
};

const deploy = resolveDeployDir();
if (!deploy) process.exit(1);

for (const page of ['index.html', 'investor.html', 'disclosures.html']) {
  if (!fs.existsSync(path.join(deploy.dir, page))) {
    fail(`Missing required output page: ${deploy.label}/${page}`);
  }
}

const indexHtml = fs.readFileSync(path.join(deploy.dir, 'index.html'), 'utf8');
if (!/<div\s+id=["']root["']/.test(indexHtml)) {
  fail(`${deploy.label}/index.html MUST contain <div id="root">`);
}
if (!/<script\s+type=["']module["'][^>]*src=["'][^"']+["']/.test(indexHtml)) {
  fail(
    `${deploy.label}/index.html MUST contain a module <script> with src attribute`
  );
}

const artifacts = collectFiles(deploy.dir);

for (const artifact of artifacts) {
  const rel = path.relative(deploy.dir, artifact);
  const scannable = fs.readFileSync(artifact, 'utf8');

  for (const term of forbiddenTerms) {
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
    let m;
    while ((m = re.exec(scannable)) !== null) {
      const start = Math.max(0, m.index - 120);
      const end = Math.min(scannable.length, m.index + m[0].length + 120);
      const ctx = scannable.slice(start, end).toLowerCase();
      const negated =
        /\b(no|not|without|never|non)\b/.test(ctx) ||
        /not\s+an\s+offer/.test(ctx) ||
        /informational\s+only/.test(ctx);
      if (!negated) {
        fail(
          `Forbidden term "${term}" found in ${deploy.label}/${rel} without explicit negation nearby.`
        );
      }
    }
  }

  for (const term of offerLikeTerms) {
    const re = new RegExp(escapeRegex(term), 'gi');
    let m;
    while ((m = re.exec(scannable)) !== null) {
      const start = Math.max(0, m.index - 200);
      const end = Math.min(scannable.length, m.index + term.length + 200);
      const ctx = scannable.slice(start, end);
      if (!hasNonOfferFraming(ctx)) {
        fail(
          `Offer-like term "${term}" found in ${deploy.label}/${rel} without non-offer framing nearby.`
        );
      }
    }
  }
}

for (const htmlFile of ['investor.html', 'disclosures.html']) {
  const htmlPath = path.join(deploy.dir, htmlFile);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const d of requiredDisclaimers) {
    if (!d.checks.every((pat) => pat.test(html))) {
      fail(
        `Missing required disclaimer "${d.label}" in ${deploy.label}/${htmlFile}`
      );
    }
  }
}

try {
  JSON.parse(fs.readFileSync(truthPath, 'utf8'));
} catch {
  fail('truth/gnco.truth.json is not valid JSON.');
}

for (const file of fs.readdirSync(jurisdictionDir)) {
  if (!file.endsWith('.json') || file === 'manifest.json') continue;
  let payload;
  try {
    payload = JSON.parse(
      fs.readFileSync(path.join(jurisdictionDir, file), 'utf8')
    );
  } catch {
    fail(`${file} is not valid JSON.`);
    continue;
  }

  for (const source of payload.primary_sources || []) {
    if (!source?.url || typeof source.url !== 'string') {
      fail(`${file} contains a primary source with missing URL.`);
      continue;
    }
    try {
      const parsed = new URL(source.url);
      if (parsed.protocol !== 'https:') {
        fail(`${file} contains non-https primary source URL: ${source.url}`);
      }
    } catch {
      fail(`${file} contains invalid primary source URL: ${source.url}`);
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('✅ Investor claims guard checks passed.');
