import type { FundNode } from "../types";

type NodeId = string;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Deterministic PRNG based on string id (stable across sessions)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round(n);

// Source anchors (fixed per spec)
const SRC_ALFI_RAIF = "https://www.alfi.lu/...";
const SRC_IE_QIAIF = "https://www.pinsentmasons.com/...";
const SRC_WEF_TOKENIZATION =
  "https://reports.weforum.org/docs/WEF_Asset_Tokenization_in_Financial_Markets_2025.pdf";
const SRC_COINBASE_BORROW = "https://www.coinbase.com/borrow";
const SRC_AAVE_HORIZON = "https://aave.com/blog/horizon-launch";

// =====================
// LAYER 1: Jurisdictions
// =====================
type JurisdictionRegion = "EU" | "Asia" | "MENA" | "Offshore";
type Jurisdiction = {
  key: string;
  label: string;
  region: JurisdictionRegion;
  tags: string[];
  primaryRegime: string;
};

const JURISDICTIONS: Jurisdiction[] = [
  { key: "LUX", label: "Luxembourg", region: "EU", tags: ["EU_PASSPORT", "TOKENIZATION"], primaryRegime: "RAIF" },
  { key: "IRL", label: "Ireland", region: "EU", tags: ["EU_PASSPORT"], primaryRegime: "QIAIF" },
  { key: "UK", label: "United Kingdom", region: "EU", tags: [], primaryRegime: "LTAF" },
  { key: "CHE", label: "Switzerland", region: "EU", tags: ["TOKENIZATION", "CRYPTO_FINANCING"], primaryRegime: "LPCC" },
  { key: "SGP", label: "Singapore", region: "Asia", tags: ["TOKENIZATION", "CRYPTO_FINANCING"], primaryRegime: "VCC" },
  { key: "HKG", label: "Hong Kong", region: "Asia", tags: ["TOKENIZATION"], primaryRegime: "OFC" },
  { key: "DIFC", label: "UAE – DIFC", region: "MENA", tags: ["CRYPTO_FINANCING"], primaryRegime: "DIFC_FUND" },
  { key: "ADGM", label: "UAE – ADGM", region: "MENA", tags: ["TOKENIZATION", "CRYPTO_FINANCING"], primaryRegime: "ADGM_FUND" },
  { key: "CYP", label: "Cyprus", region: "EU", tags: ["EU_PASSPORT", "TOKENIZATION", "CRYPTO_FINANCING"], primaryRegime: "AIFMD_STYLE" },
  { key: "CYM", label: "Cayman Islands", region: "Offshore", tags: ["CRYPTO_FINANCING"], primaryRegime: "PRIVATE_FUND" }
];

// =====================
// LAYER 2: Regulatory regimes
// =====================
const layer2Catalog: Record<string, { label: string; sources: string[] }> = {
  RAIF: { label: "RAIF (Reserved Alternative Investment Fund)", sources: [SRC_ALFI_RAIF] },
  QIAIF: { label: "QIAIF (Qualifying Investor AIF)", sources: [SRC_IE_QIAIF] },
  LTAF: { label: "LTAF (Long-Term Asset Fund)", sources: [] },
  VCC: { label: "VCC (Variable Capital Company)", sources: [] },
  OFC: { label: "OFC (Open-ended Fund Company)", sources: [] },
  DIFC_FUND: { label: "DIFC Fund Regime", sources: [] },
  ADGM_FUND: { label: "ADGM Fund Regime", sources: [] },
  PRIVATE_FUND: { label: "Private Fund (CIMA-registered)", sources: [] },
  AIFMD_STYLE: { label: "AIFMD-style Manager + Fund", sources: [] },
  PRO_FUND: { label: "Professional / Qualified Investor Fund", sources: [] },
  RETAIL_LIMITED: { label: "Limited Retail Access Regime", sources: [] }
};

// =====================
// LAYER 3+: Fixed catalogs
// =====================
const layer3Vehicles = [
  { key: "SCSP", label: "Limited Partnership (SCSp / LP)" },
  { key: "ICAV", label: "ICAV / Corporate Fund Vehicle" },
  { key: "PCC", label: "PCC (Protected Cell Company)" },
  { key: "SICAV", label: "SICAV / Investment Company" },
  { key: "GP_LP", label: "GP/LP Partnership Stack" },
  { key: "UNIT_TRUST", label: "Unit Trust" },
  { key: "SICAF", label: "SICAF / Closed-ended Corporate" },
  { key: "SPV_STACK", label: "SPV Stack (HoldCo + PropCos)" }
] as const;

const layer4Strategies = [
  "Real Estate (Core / Core+)",
  "Real Estate (Value-Add)",
  "Real Estate (Opportunistic)",
  "Private Credit",
  "Infrastructure",
  "Private Equity",
  "Multi-Strategy",
  "Secondaries",
  "Hedge / Absolute Return"
] as const;

const layer5Liquidity = [
  "Open-ended (Daily/Weekly NAV)",
  "Open-ended (Monthly/Quarterly NAV)",
  "Closed-ended (Fixed Term)",
  "Evergreen (Periodic Liquidity)",
  "Semi-Liquid (Gates + Side Pockets)",
  "Interval Fund (Scheduled Repurchases)"
] as const;

const layer6Economics = [
  "Multiple Share Classes (Hedged/Unhedged)",
  "Founders Class + Fee Breakpoints",
  "Co-invest SPVs (Deal-by-Deal)",
  "Side Letters (MFN / Capacity)",
  "Performance Fee (Hurdle + Catch-up)",
  "Carry Waterfall (European / American)",
  "Liquidity Fees + Redemption Gates",
  "Management Fee (Tiered AUM)"
] as const;

const layer7Financing = [
  "Subscription Line (Capital Call Facility)",
  "NAV Facility (Portfolio-backed)",
  "Hybrid Facility (Sub + NAV)",
  "Asset-level Senior Debt",
  "Mezzanine / Preferred Equity",
  "Repo / Securities Financing",
  "Hedging Lines (FX/IR Swaps)",
  "Bridge-to-Exit Facility"
] as const;

// Layer 8 must include Crypto Financing + Tokenization branches, but keep dense (5-10)
type DigitalOption = { key: string; label: string; tags: string[]; sources: string[] };

const layer8Digital: DigitalOption[] = [
  { key: "CRYPTO_FIN", label: "Crypto Financing (Borrow/Lend)", tags: ["CRYPTO_FINANCING"], sources: [SRC_COINBASE_BORROW, SRC_AAVE_HORIZON] },
  { key: "TOKEN", label: "Tokenization (Real Asset Tokens)", tags: ["TOKENIZATION"], sources: [SRC_WEF_TOKENIZATION] },
  { key: "CUSTODY", label: "Digital Asset Custody & Controls", tags: [], sources: [] },
  { key: "TREASURY", label: "Stablecoin Treasury & Payments", tags: [], sources: [] },
  { key: "ONCHAIN", label: "On-chain Reporting / Proof-of-Reserves", tags: [], sources: [] },
  { key: "NONE", label: "No Digital Assets Exposure", tags: [], sources: [] }
];

const layer9Governance = [
  "AIFM / Management Company",
  "Fund Administrator",
  "Depositary / Custodian",
  "Auditor",
  "Legal Counsel",
  "Corporate Services / Company Secretary",
  "Registrar & Transfer Agent",
  "Valuation Agent",
  "Compliance Officer / MLRO",
  "Tech Provider (Tokenization/Custody)"
] as const;

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function pickN<T>(rng: () => number, arr: readonly T[], min: number, max: number): T[] {
  const n = Math.max(min, Math.min(max, Math.floor(min + rng() * (max - min + 1))));
  // stable shuffle
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function scoreTemplate(rng: () => number, base: Partial<FundNode["data"]["factorScores"]> = {}) {
  const raw = {
    speed: round(45 + rng() * 45),
    governance: round(45 + rng() * 45),
    familiarity: round(40 + rng() * 50),
    cost: round(40 + rng() * 50),
    conservatism: round(35 + rng() * 55),
    digital: round(35 + rng() * 55),
    ...base
  };
  // clamp
  return {
    speed: clamp(raw.speed),
    governance: clamp(raw.governance),
    familiarity: clamp(raw.familiarity),
    cost: clamp(raw.cost),
    conservatism: clamp(raw.conservatism),
    digital: clamp(raw.digital)
  };
}

function makeNode(params: {
  id: NodeId;
  layer: number;
  label: string;
  summary: string;
  jurisdiction?: string;
  advantages: string[];
  disadvantages: string[];
  sources: string[];
  tags: string[];
  factorScores: FundNode["data"]["factorScores"];
  children: NodeId[];
}): FundNode {
  return {
    id: params.id,
    layer: params.layer,
    label: params.label,
    summary: normalizeText(params.summary),
    data: {
      jurisdiction: params.jurisdiction,
      advantages: params.advantages,
      disadvantages: params.disadvantages,
      sources: params.sources,
      tags: params.tags,
      factorScores: params.factorScores
    },
    children: params.children
  };
}

function parseLayer(id: NodeId): number {
  // id shape: L1::... or L2::... etc
  const m = id.match(/^L(\d)::/);
  if (!m) return 0;
  return Number(m[1]);
}

function getJurKeyFromId(id: NodeId): string | undefined {
  const m = id.match(/JUR::([A-Z0-9_\-]+)/);
  return m?.[1];
}

function buildChildrenIds(parentId: NodeId): NodeId[] {
  const layer = parseLayer(parentId);
  const rng = mulberry32(hashString(parentId));

  const jurKey = getJurKeyFromId(parentId);
  const jur = jurKey ? JURISDICTIONS.find((j) => j.key === jurKey) : undefined;

  if (layer === 1 && jur) {
    // Regulatory regimes: ensure primary + enough density
    const allRegKeys = Object.keys(layer2Catalog);
    const picks = pickN(rng, allRegKeys, 5, 8);

    if (!picks.includes(jur.primaryRegime)) {
      picks[0] = jur.primaryRegime;
    }

    return picks.map((rk) => `L2::JUR::${jur.key}::REG::${rk}`);
  }

  if (layer === 2) {
    const pool = layer3Vehicles.map((v) => v.key);
    const picks = pickN(rng, pool, 5, 8);
    return picks.map((vk) => `${parentId}::VEH::${vk}`);
  }

  if (layer === 3) {
    // Requirement: start with Real Estate then generic
    const realEstate = layer4Strategies.filter((s) => s.startsWith("Real Estate"));
    const others = layer4Strategies.filter((s) => !s.startsWith("Real Estate"));
    const ordered = [...realEstate, ...others];
    const dense = pickN(rng, ordered, 5, 9);
    return dense.map((_, idx) => `${parentId}::STR::${idx}`);
  }

  if (layer === 4) {
    const picks = pickN(rng, layer5Liquidity, 5, 6);
    return picks.map((_, idx) => `${parentId}::LIQ::${idx}`);
  }

  if (layer === 5) {
    const picks = pickN(rng, layer6Economics, 5, 8);
    return picks.map((_, idx) => `${parentId}::ECO::${idx}`);
  }

  if (layer === 6) {
    const picks = pickN(rng, layer7Financing, 5, 8);
    return picks.map((_, idx) => `${parentId}::FIN::${idx}`);
  }

  if (layer === 7) {
    // Digital assets layer (keep fixed catalog but can shuffle for density)
    let picks = pickN(rng, layer8Digital, 5, 6);

    // Ensure both CRYPTO_FIN and TOKEN are included
    const requiredKeys = ["CRYPTO_FIN", "TOKEN"];
    for (const rk of requiredKeys) {
      if (!picks.some((p) => p.key === rk)) {
        const required = layer8Digital.find((x) => x.key === rk);
        if (required) picks = [...picks, required];
      }
    }

    // De-dup by key
    const uniq = Array.from(new Map(picks.map((p) => [p.key, p])).values());

    // Keep 5–6 children (per your previous logic)
    const final = uniq.slice(0, 6);

    return final.map((d) => `${parentId}::DIG::${d.key}`);
  }

  if (layer === 8) {
    const picks = pickN(rng, layer9Governance, 5, 10);
    return picks.map((_, idx) => `${parentId}::GOV::${idx}`);
  }

  // layer 9 terminal
  return [];
}

function buildNode(id: NodeId, inheritedTags: string[] = []): FundNode {
  const layer = parseLayer(id);
  const rng = mulberry32(hashString(id));

  if (layer === 1) {
    const jurKey = id.split("JUR::")[1] as string;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;
    const children = buildChildrenIds(id);

    const baseScores = scoreTemplate(rng, {
      governance: jur.region === "EU" ? 85 : round(55 + rng() * 35),
      familiarity: jur.region === "EU" ? 80 : round(45 + rng() * 40),
      speed: jur.key === "CYM" ? 85 : round(50 + rng() * 35),
      cost: jur.key === "CYM" ? 75 : round(45 + rng() * 40),
      digital: jur.tags.includes("TOKENIZATION") || jur.tags.includes("CRYPTO_FINANCING") ? 80 : round(45 + rng() * 35),
      conservatism: jur.region === "EU" ? 85 : round(45 + rng() * 40)
    });

    return makeNode({
      id,
      layer,
      label: jur.label,
      jurisdiction: jur.label,
      summary: `${jur.label} as a domicile option. Use this branch to evaluate regulatory regimes, vehicle choices, and downstream structuring decisions.`,
      advantages: [
        jur.region === "EU"
          ? "Access to EU/EEA distribution frameworks (where applicable)."
          : "Flexible structuring playbooks for professional investors.",
        "Established service provider ecosystem (admin, audit, legal).",
        "Predictable fund documentation patterns for institutional LPs."
      ],
      disadvantages: [
        jur.region === "EU"
          ? "Higher regulatory overhead and ongoing compliance cadence."
          : "Perceived investor preference may vary by allocator base.",
        "Timeline/cost can expand depending on governance and provider setup.",
        "Always confirm marketing and investor eligibility boundaries."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: baseScores,
      children
    });
  }

  if (layer === 2) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const regKey = (id.split("::REG::")[1] as string | undefined) ?? "UNKNOWN";
    const reg = layer2Catalog[regKey] ?? { label: regKey, sources: [] as string[] };

    const children = buildChildrenIds(id);
    const sources = reg.sources.length ? reg.sources : [];
    const summary = `Regulatory regime: ${reg.label}. This node frames eligibility, authorization vs. notification, and operational perimeter for the fund and manager.`;

    return makeNode({
      id,
      layer,
      label: reg.label,
      jurisdiction: jur.label,
      summary,
      advantages: [
        "Defines investor eligibility and marketing perimeter.",
        "Clarifies authorization/registration pathway and ongoing reporting.",
        "Aligns governance expectations (risk, valuation, AML)."
      ],
      disadvantages: [
        "Regime specifics can materially affect timeline and cost.",
        "Cross-border distribution usually adds layered requirements.",
        "Always validate with local counsel and competent authority guidance."
      ],
      sources,
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        governance: jur.region === "EU" ? 88 : round(55 + rng() * 35),
        speed: regKey === "RAIF" ? 70 : round(50 + rng() * 40),
        cost: regKey === "RAIF" ? 60 : round(45 + rng() * 40),
        digital: jur.tags.includes("TOKENIZATION") ? 75 : round(40 + rng() * 45)
      }),
      children
    });
  }

  if (layer === 3) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const vehKey = id.split("::VEH::")[1];
    const veh = layer3Vehicles.find((v) => v.key === vehKey);
    const children = buildChildrenIds(id);

    return makeNode({
      id,
      layer,
      label: veh?.label ?? `Vehicle ${vehKey}`,
      jurisdiction: jur.label,
      summary: `Legal vehicle selection impacts tax transparency, governance, investor onboarding, and operational complexity.`,
      advantages: [
        "Controls liability / ring-fencing and investor rights.",
        "Sets the baseline for fund documentation patterns.",
        "Can optimize operational workflows (classes, SPVs, reporting)."
      ],
      disadvantages: [
        "Vehicle choice can constrain financing and custody options.",
        "Some vehicles require heavier governance and audit overhead.",
        "Investor familiarity varies by allocator and region."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        governance: jur.region === "EU" ? 85 : round(50 + rng() * 40),
        cost: round(45 + rng() * 45),
        speed: round(45 + rng() * 45),
        digital: jur.tags.includes("TOKENIZATION") ? 70 : round(40 + rng() * 45)
      }),
      children
    });
  }

  if (layer === 4) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const idx = Number(id.split("::STR::")[1]);
    const label = layer4Strategies[idx] ?? `Strategy ${idx}`;
    const children = buildChildrenIds(id);

    return makeNode({
      id,
      layer,
      label,
      jurisdiction: jur.label,
      summary: `Strategy drives portfolio construction, valuation frequency, liquidity mechanics, and investor reporting posture.`,
      advantages: [
        "Clarifies target investors and distribution narrative.",
        "Sets guardrails for risk limits, leverage, and concentration.",
        "Aligns service provider selection (valuation, admin)."
      ],
      disadvantages: [
        "More complex strategies may demand heavier governance.",
        "Liquidity and financing options may narrow for illiquid assets.",
        "Digital overlays require additional controls and policies."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        speed: label.includes("Real Estate") ? round(55 + rng() * 30) : round(45 + rng() * 40),
        digital: label.includes("Hedge") ? round(55 + rng() * 35) : round(40 + rng() * 45),
        governance: round(55 + rng() * 35),
        cost: round(45 + rng() * 45)
      }),
      children
    });
  }

  if (layer === 5) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const idx = Number(id.split("::LIQ::")[1]);
    const label = layer5Liquidity[idx] ?? `Liquidity ${idx}`;
    const children = buildChildrenIds(id);

    return makeNode({
      id,
      layer,
      label,
      jurisdiction: jur.label,
      summary: `Liquidity model determines dealing cycle, valuation cadence, gates/side pockets, and investor expectations.`,
      advantages: [
        "Aligns portfolio liquidity with redemption rights.",
        "Improves investor communications via predictable dealing schedule.",
        "Enables structured risk controls (gates, pockets, notice)."
      ],
      disadvantages: [
        "Open-ended models raise liquidity management complexity.",
        "Closed-ended terms can reduce investor optionality.",
        "Provider workflows and valuation timing can be operationally heavy."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        speed: label.startsWith("Open-ended") ? 65 : round(45 + rng() * 45),
        governance: label.includes("Gates") ? 80 : round(50 + rng() * 40),
        cost: label.includes("Open-ended") ? 55 : round(45 + rng() * 45)
      }),
      children
    });
  }

  if (layer === 6) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const idx = Number(id.split("::ECO::")[1]);
    const label = layer6Economics[idx] ?? `Economics ${idx}`;
    const children = buildChildrenIds(id);

    return makeNode({
      id,
      layer,
      label,
      jurisdiction: jur.label,
      summary: `Economics options define share class mechanics, fee/carry terms, and co-invest rights.`,
      advantages: [
        "Supports allocator segmentation via classes and fee tiers.",
        "Co-invest can improve net returns and LP alignment.",
        "Side letters can unlock commitments (MFN/capacity)."
      ],
      disadvantages: [
        "Complex economics increase admin workload and disclosure needs.",
        "Side letters can create operational and fairness challenges.",
        "Carry structures must match jurisdiction-specific constraints."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        governance: 70,
        familiarity: 75,
        speed: 55,
        cost: round(45 + rng() * 45)
      }),
      children
    });
  }

  if (layer === 7) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const idx = Number(id.split("::FIN::")[1]);
    const label = layer7Financing[idx] ?? `Financing ${idx}`;
    const children = buildChildrenIds(id);

    return makeNode({
      id,
      layer,
      label,
      jurisdiction: jur.label,
      summary: `TradFi financing options impact subscription mechanics, liquidity bridges, and leverage constraints.`,
      advantages: [
        "Facilities can smooth capital calls and deployment pacing.",
        "NAV lines can optimize portfolio-level liquidity planning.",
        "Better IRR optics for certain investor profiles (with disclosure)."
      ],
      disadvantages: [
        "Leverage adds documentation, covenants, and monitoring overhead.",
        "Facility terms can impact distributions and liquidity rights.",
        "Always align with fund docs and risk disclosures."
      ],
      sources: [],
      tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
      factorScores: scoreTemplate(rng, {
        cost: round(40 + rng() * 40),
        governance: 75,
        speed: 55,
        digital: jur.tags.includes("CRYPTO_FINANCING") ? 70 : round(35 + rng() * 50)
      }),
      children
    });
  }

  if (layer === 8) {
    const jurKey = getJurKeyFromId(id)!;
    const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

    const digKey = id.split("::DIG::")[1];
    const entry = layer8Digital.find((d) => d.key === digKey);

    const children = buildChildrenIds(id);

    const baseTags = Array.from(new Set([...jur.tags, ...inheritedTags, ...(entry?.tags ?? [])]));
    const sources = entry?.sources ?? [];

    let summary = `Digital assets decision point: ${entry?.label ?? digKey}.`;
    if (digKey === "CRYPTO_FIN") {
      summary =
        "Crypto financing rail for the fund (e.g., centralized borrowing, DeFi borrowing). Include policy gating, counterparty risk limits, and custody controls.";
    } else if (digKey === "TOKEN") {
      summary =
        "Tokenization rail (e.g., real asset tokens, digital bonds, tokenized fund units). Include issuance/custody model and investor onboarding controls.";
    }

    return makeNode({
      id,
      layer,
      label: entry?.label ?? `Digital: ${digKey}`,
      jurisdiction: jur.label,
      summary,
      advantages: [
        digKey === "TOKEN"
          ? "Potentially improved transferability and operational automation."
          : "Broader financing/treasury optionality in digital-native stacks.",
        "Can attract allocators with digital mandate or innovation thesis.",
        "Enables future-proofing for reporting and settlement rails."
      ],
      disadvantages: [
        "Adds material compliance and control requirements (KYC/AML, custody, tech risk).",
        "Provider selection becomes critical (custody, security, audits).",
        "Regulatory perimeter can evolve; verify continuously."
      ],
      sources,
      tags: baseTags,
      factorScores: scoreTemplate(rng, {
        digital: digKey === "TOKEN" || digKey === "CRYPTO_FIN" ? 90 : round(45 + rng() * 40),
        governance: 70,
        speed: digKey === "NONE" ? 75 : round(45 + rng() * 40),
        cost: digKey === "NONE" ? 70 : round(35 + rng() * 45)
      }),
      children
    });
  }

  // layer 9 (terminal)
  const jurKey = getJurKeyFromId(id)!;
  const jur = JURISDICTIONS.find((j) => j.key === jurKey)!;

  const idx = Number(id.split("::GOV::")[1]);
  const label = layer9Governance[idx] ?? `Governance ${idx}`;

  return makeNode({
    id,
    layer: 9,
    label,
    jurisdiction: jur.label,
    summary:
      "Governance stack (service providers) required to operate the structure. Choose providers aligned to strategy, liquidity, and any digital overlay.",
    advantages: [
      "Clear accountability and operational resilience.",
      "Supports investor due diligence and reporting expectations.",
      "Enables scalable operations as AUM grows."
    ],
    disadvantages: [
      "Provider costs are recurring and add to OPEX.",
      "Coordination overhead across providers can slow changes.",
      "Jurisdiction-specific independence rules may apply."
    ],
    sources: [],
    tags: Array.from(new Set([...jur.tags, ...inheritedTags])),
    factorScores: scoreTemplate(rng, {
      governance: 90,
      familiarity: 80,
      speed: 55,
      cost: 50,
      digital: jur.tags.includes("TOKENIZATION") || jur.tags.includes("CRYPTO_FINANCING") ? 75 : 55
    }),
    children: []
  });
}

export class MockDataManager {
  private cache = new Map<NodeId, FundNode>();

  // NOTE: Simulated chunking: the "server" only returns nodes for the requested parent.
  async getRootNodes(): Promise<FundNode[]> {
    await sleep(250);
    const roots: FundNode[] = [];
    for (const j of JURISDICTIONS) {
      const id = `L1::JUR::${j.key}`;
      if (!this.cache.has(id)) this.cache.set(id, buildNode(id));
      roots.push(this.cache.get(id)!);
    }
    return roots;
  }

  getNode(id: NodeId): FundNode | undefined {
    return this.cache.get(id);
  }

  async fetchChildren(parentId: NodeId): Promise<FundNode[]> {
    // simulate network + chunk lookups
    await sleep(280 + Math.floor(Math.random() * 240));

    const parent =
      this.cache.get(parentId) ??
      (() => {
        // If a node is requested before caching, build it (still deterministic)
        const built = buildNode(parentId);
        this.cache.set(parentId, built);
        return built;
      })();

    if (!parent.children || parent.children.length === 0) return [];

    const children: FundNode[] = [];
    const inheritedTags = parent.data.tags;

    for (const cid of parent.children) {
      if (!this.cache.has(cid)) {
        this.cache.set(cid, buildNode(cid, inheritedTags));
      }
      children.push(this.cache.get(cid)!);
    }

    return children;
  }
}

export const mockDataManager = new MockDataManager();

export const SOURCE_FALLBACK = "General market practice; verify with counsel.";
