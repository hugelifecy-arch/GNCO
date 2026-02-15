export const forbiddenTerms = [
  'APY',
  'ROI',
  'returns',
  'yield',
  'guaranteed',
  'risk-free',
  'profit'
];

export const offerLikeTerms = [
  '0% fees',
  'VIP',
  'tier',
  'subscribe now',
  'buy',
  'token sale',
  'launch'
];

export const requiredDisclaimers = [
  {
    label: 'informational only',
    checks: [/informational\s+only/i]
  },
  {
    label: 'not an offer',
    checks: [/not\s+an\s+offer/i]
  },
  {
    label: 'not advice',
    checks: [
      /(not\s+investment\s+advice|not\s+legal\s+advice|not\s+tax\s+advice|does\s+not\s+provide\s+.*advice)/i
    ]
  },
  {
    label: 'verify with qualified professionals',
    checks: [
      /(verify|validated?|confirm)\s+with\s+(qualified\s+)?(professionals?|counsel|advisors?)/i
    ]
  }
];

const framingPattern =
  /(prototype|informational\s+only|not\s+an\s+offer|not\s+investment\s+advice|not\s+legal\s+advice|not\s+tax\s+advice|does\s+not\s+provide\s+.*advice|no\s+offer|no\s+guarante(?:ed|e)|no\s+apy|no\s+roi|no\s+returns|always\s+verify\s+with\s+qualified\s+professionals)/i;

export const hasNonOfferFraming = (context) => framingPattern.test(context);
