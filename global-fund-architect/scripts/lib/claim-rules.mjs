export const forbiddenTerms = [
  'APY',
  'ROI',
  'returns',
  'yield',
  'risk-free',
  'profit',
  'launch'
];

export const offerLikeTerms = [
  '0% fees',
  'vip tier',
  'guaranteed',
  'exclusive allocation',
  'no lockup'
];

export const requiredDisclaimers = [
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
    checks: [
      /(verify|validated?|confirm)\s+with\s+(qualified\s+)?(professionals?|counsel|advisors?)/i
    ]
  }
];

const framingPattern =
  /(prototype|not\s+an\s+offer|not\s+investment\s+advice|informational\s+only|no\s+offer|no\s+guaranteed)/i;

export const hasNonOfferFraming = (context) => framingPattern.test(context);
