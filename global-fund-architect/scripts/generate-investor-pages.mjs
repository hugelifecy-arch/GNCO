import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPage, escapeHtml } from './lib/htmlTemplate.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');
const truthPath = path.join(repoRoot, 'truth', 'gnco.truth.json');
const publicDir = path.join(appRoot, 'public');

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

const assertTruthy = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const truth = JSON.parse(fs.readFileSync(truthPath, 'utf8'));
for (const key of requiredKeys)
  assertTruthy(key in truth, `Missing truth key: ${key}`);
assertTruthy(
  ['Prototype', 'Beta', 'Live'].includes(truth.status),
  'truth.status must be Prototype, Beta, or Live'
);

let gitSha = truth.version;
try {
  gitSha = execSync('git rev-parse --short HEAD', {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'ignore']
  })
    .toString()
    .trim();
} catch {
  // keep fallback
}
const buildDate = new Date().toISOString().slice(0, 10);

const buildMeta = {
  gitSha,
  buildDate,
  truthLastUpdated: truth.lastUpdated
};

const list = (items) =>
  (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');

const investorContent = `
  <div class="hero">
    <h1>${escapeHtml(truth.projectName)} — Investor Overview</h1>
    <p class="small">Generated from <span class="code">truth/gnco.truth.json</span>.</p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Project overview</h2>
    <p>${escapeHtml(truth.whatItIs)}</p>
    <p><b>Status:</b> ${escapeHtml(truth.status)}</p>
  </div>

  <div class="card" style="margin-top:14px">
    <h2 style="margin-top:0">What this software is not</h2>
    <ul>${list(truth.whatItIsNot)}</ul>
    <p class="small">
      Prototype software. <b>Informational only</b>. <b>Not an offer</b>. <b>Not investment/legal/tax advice</b>.
      <b>Verify with qualified professionals</b>.
    </p>
  </div>

  <div class="grid" style="margin-top:14px">
    <div class="card">
      <h2 style="margin-top:0">Features available now</h2>
      <ul>${list(truth.featuresNow)}</ul>
    </div>
    <div class="card">
      <h2 style="margin-top:0">Planned / under research</h2>
      <ul>${list(truth.featuresPlanned)}</ul>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <h2 style="margin-top:0">Risk disclosures</h2>
    <ul>${list(truth.riskDisclosureBullets)}</ul>
  </div>
`;

const disclosuresContent = `
  <div class="hero">
    <h1>${escapeHtml(truth.projectName)} — Disclosures</h1>
    <p class="small">Applies to all pages and outputs.</p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Four-part disclosure</h2>
    <ul>
      <li><b>Informational only:</b> prototype documentation and scenario design.</li>
      <li><b>Not an offer:</b> no solicitation, invitation, or recommendation.</li>
      <li><b>Not investment/legal/tax advice:</b> GNCO does not provide advice.</li>
      <li><b>Verify with qualified professionals:</b> always verify outputs before reliance.</li>
    </ul>
  </div>

  <div class="card" style="margin-top:14px">
    <h2 style="margin-top:0">Forward-looking statements</h2>
    <p>Roadmap, timing, adoption, or expected outcomes are forward-looking and subject to material uncertainty.</p>
  </div>

  <div class="card" style="margin-top:14px">
    <h2 style="margin-top:0">Technology and methodology limitations</h2>
    <ul>${list(truth.riskDisclosureBullets)}</ul>
    <p class="small">Do not rely on outputs without independent verification by qualified professionals.</p>
  </div>
`;

const investorHtml = buildPage({
  title: 'GNCO — Investor Overview (Prototype)',
  description:
    'GNCO is prototype software. Informational only. Not an offer. Not investment/legal/tax advice. Verify with qualified professionals.',
  canonical: 'https://hugelifecy-arch.github.io/GNCO/investor.html',
  ogUrl: 'https://hugelifecy-arch.github.io/GNCO/investor.html',
  navActive: 'investor',
  contentHtml: investorContent,
  buildMeta
});

const disclosuresHtml = buildPage({
  title: 'GNCO — Disclosures (Prototype)',
  description:
    'GNCO is prototype software. Informational only. Not an offer. Not investment/legal/tax advice. Verify with qualified professionals.',
  canonical: 'https://hugelifecy-arch.github.io/GNCO/disclosures.html',
  ogUrl: 'https://hugelifecy-arch.github.io/GNCO/disclosures.html',
  navActive: 'disclosures',
  contentHtml: disclosuresContent,
  buildMeta
});

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'investor.html'), investorHtml);
fs.writeFileSync(path.join(publicDir, 'disclosures.html'), disclosuresHtml);

process.stdout.write(
  'Generated public/investor.html and public/disclosures.html\n'
);
