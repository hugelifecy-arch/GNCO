export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildNav = (active) => {
  const link = (href, label, key) =>
    `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
  return `
  <div class="nav">
    <div class="inner">
      <div class="brand">
        <div style="width:10px;height:10px;border-radius:999px;background:var(--accent);box-shadow:0 0 24px rgba(96,165,250,.55)"></div>
        <b>GNCO</b>
        <span class="badge">Prototype</span>
      </div>
      <div class="navlinks" aria-label="Site">
        ${link("./", "Product", "product")}
        ${link("./coverage.html", "Coverage", "coverage")}
        ${link("./methodology.html", "Methodology", "methodology")}
        ${link("./investor.html", "Investor", "investor")}
        ${link("./disclosures.html", "Disclosures", "disclosures")}
      </div>
    </div>
  </div>`;
};

export const buildFooter = ({ buildMeta }) => `
  <div class="footer">
    <div>
      <b>Important:</b> GNCO is prototype software. <b>Informational only</b>.
      <b>Not an offer</b> or solicitation. <b>Not investment/legal/tax advice</b>.
      <b>Verify with qualified professionals</b>.
      See <a href="./disclosures.html">Disclosures</a>.
    </div>
    ${
      buildMeta
        ? `<div style="margin-top:8px">Build: <span class="code">${escapeHtml(
            buildMeta.gitSha
          )}</span> • Build date: <span class="code">${escapeHtml(
            buildMeta.buildDate
          )}</span> • Truth lastUpdated: <span class="code">${escapeHtml(
            buildMeta.truthLastUpdated
          )}</span></div>`
        : ""
    }
  </div>
`;

export const buildPage = ({
  title,
  description,
  canonical,
  ogUrl,
  navActive,
  contentHtml,
  buildMeta
}) => {
  const t = escapeHtml(title);
  const d = escapeHtml(description || "");
  const c = escapeHtml(canonical || ogUrl || "");
  const ou = escapeHtml(ogUrl || canonical || "");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${c}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${ou}" />
  <link rel="stylesheet" href="./assets_gnco.css" />
</head>
<body>
${buildNav(navActive)}
<div class="container">
${contentHtml}
${buildFooter({ buildMeta })}
</div>
</body>
</html>`;
};
