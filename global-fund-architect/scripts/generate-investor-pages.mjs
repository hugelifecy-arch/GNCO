import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPage, escapeHtml } from './lib/site-template.mjs';

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

const assertTruthy = (condition, message) => {
  if (!condition) throw new Error(message);
};

const truth = JSON.parse(fs.readFileSync(truthPath, 'utf8'));
for (const key of requiredKeys) {
  assertTruthy(key in truth, `Missing required truth key: ${key}`);
}
assertTruthy(
  ['Prototype', 'Beta', 'Live'].includes(truth.status),
  'status must be Prototype, Beta, or Live'
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
  // keep truth.version fallback
}

const buildDate = new Date().toISOString().slice(0, 10);

const list = (items) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');

const investorHtml = buildPage({
  title: 'GNCO Investor Overview',
  description: 'GNCO prototype compliance documentation and disclosures.',
  canonical: 'https://hugelifecy-arch.github.io/GNCO/investor.html',
  ogUrl: 'https://hugelifecy-arch.github.io/GNCO/investor.html',
  navActive: 'investor',
  buildMeta: {
    gitSha,
    buildDate,
    truthLastUpdated: truth.lastUpdated
  },
  contentHtml: `<main>
    <h1>${escapeHtml(truth.projectName)} — Investor Overview</h1>
    <p class="meta">Generated from <code>truth/gnco.truth.json</code>.</p>
    <section class="card">
      <h2>Project overview</h2>
      <p>${escapeHtml(truth.whatItIs)}</p>
      <p><strong>Status:</strong> ${escapeHtml(truth.status)}</p>
    </section>
    <section class="card">
      <h2>What this software is not</h2>
      <ul>${list(truth.whatItIsNot)}</ul>
      <p><strong>Compliance statement:</strong> No guaranteed returns, no APY, and not investment advice.</p>
    </section>
    <section class="card">
      <h2>Features available now</h2>
      <ul>${list(truth.featuresNow)}</ul>
    </section>
    <section class="card">
      <h2>Planned / under research</h2>
      <ul>${list(truth.featuresPlanned)}</ul>
    </section>
    <section class="card">
      <h2>Risk disclosures</h2>
      <ul>${list(truth.riskDisclosureBullets)}</ul>
    </section>
  </main>`
});

const disclosuresHtml = buildPage({
  title: 'GNCO Disclosures',
  description: 'Key prototype disclosures for GNCO investor-facing materials.',
  canonical: 'https://hugelifecy-arch.github.io/GNCO/disclosures.html',
  ogUrl: 'https://hugelifecy-arch.github.io/GNCO/disclosures.html',
  navActive: 'disclosures',
  buildMeta: {
    gitSha,
    buildDate,
    truthLastUpdated: truth.lastUpdated
  },
  contentHtml: `<main>
    <h1>${escapeHtml(truth.projectName)} — Disclosures</h1>
    <section class="card">
      <h2>Not an offer; not investment advice</h2>
      <p>Nothing on this site constitutes an offer, invitation, recommendation, or solicitation to buy or sell securities or any other financial product. Content is informational only and is not legal, tax, accounting, or investment advice.</p>
    </section>
    <section class="card">
      <h2>Forward-looking statements</h2>
      <p>Any statement regarding roadmap, release timing, market adoption, or expected outcomes is forward-looking and subject to material uncertainty.</p>
    </section>
    <section class="card">
      <h2>Technology and methodology limitations</h2>
      <ul>${list(truth.riskDisclosureBullets)}</ul>
      <p>Outputs must be independently verified with qualified professionals before reliance.</p>
    </section>
    <section class="card">
      <h2>Status and scope</h2>
      <p><strong>Status:</strong> ${escapeHtml(truth.status)}</p>
      <p><strong>Scope today:</strong> ${escapeHtml(truth.whatItIs)}</p>
      <p><strong>Out of scope:</strong> This is prototype software and not an investment product.</p>
    </section>
  </main>`
});

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'investor.html'), investorHtml);
fs.writeFileSync(path.join(publicDir, 'disclosures.html'), disclosuresHtml);

process.stdout.write(
  'Generated public/investor.html and public/disclosures.html from truth/gnco.truth.json\n'
);
