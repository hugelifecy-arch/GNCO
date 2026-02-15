import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

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

const baseStyles = `
:root { color-scheme: dark; --bg:#020617; --card:#0f172a; --border:#1e293b; --text:#e2e8f0; --muted:#94a3b8; --accent:#38bdf8; --warn:#f59e0b; }
* { box-sizing: border-box; }
body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: linear-gradient(180deg,#020617,#0b1222); color: var(--text); }
a { color: var(--accent); }
.wrap { max-width: 980px; margin: 0 auto; padding: 1.25rem; }
nav { display:flex; flex-wrap: wrap; gap: .8rem; margin: .75rem 0 1rem; }
nav a { text-decoration: none; border:1px solid var(--border); border-radius:999px; padding:.5rem .8rem; color:var(--text); }
nav a:hover { border-color: var(--accent); }
.banner { border:1px solid #854d0e; background: rgba(245,158,11,.15); color: #fde68a; border-radius: .75rem; padding: .75rem 1rem; }
.card { background: rgba(15,23,42,.82); border:1px solid var(--border); border-radius: 1rem; padding: 1rem; margin-top: 1rem; }
h1,h2 { line-height:1.2; }
.meta { color: var(--muted); font-size: .9rem; }
li + li { margin-top: .45rem; }
code { background: rgba(15,23,42,.8); border:1px solid var(--border); border-radius:.4rem; padding:.08rem .3rem; }
`;

const list = (items) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');

const renderPage = (title, body) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="GNCO prototype compliance documentation and disclosures." />
    <meta name="robots" content="index,follow" />
    <title>${escapeHtml(title)}</title>
    <style>${baseStyles}</style>
  </head>
  <body>
    <div class="wrap">
      <div class="banner">Prototype software. Informational only. Not an offer. Not advice.</div>
      <nav aria-label="Compliance navigation">
        <a href="./investor.html">Investor Overview</a>
        <a href="./disclosures.html">Disclosures</a>
        <a href="./methodology.html">Methodology</a>
        <a href="./coverage.html">Coverage</a>
      </nav>
      ${body}
      <div class="card meta">
        <div><strong>lastUpdated:</strong> ${escapeHtml(truth.lastUpdated)}</div>
        <div><strong>buildDate:</strong> ${escapeHtml(buildDate)}</div>
        <div><strong>gitSha:</strong> ${escapeHtml(gitSha)}</div>
      </div>
    </div>
  </body>
</html>`;

const investorHtml = renderPage(
  'GNCO Investor Overview',
  `<main>
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
);

const disclosuresHtml = renderPage(
  'GNCO Disclosures',
  `<main>
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
);

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'investor.html'), investorHtml);
fs.writeFileSync(path.join(publicDir, 'disclosures.html'), disclosuresHtml);

process.stdout.write(
  'Generated public/investor.html and public/disclosures.html from truth/gnco.truth.json\n'
);
