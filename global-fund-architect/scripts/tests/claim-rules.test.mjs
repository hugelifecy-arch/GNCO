import test from 'node:test';
import assert from 'node:assert/strict';
import { hasNonOfferFraming, offerLikeTerms } from '../lib/claim-rules.mjs';

test('offer-like dictionary includes known risky terms', () => {
  assert(offerLikeTerms.includes('0% fees'));
  assert(offerLikeTerms.includes('VIP'));
  assert(offerLikeTerms.includes('token sale'));
});

test('hasNonOfferFraming detects compliant framing language', () => {
  assert.equal(
    hasNonOfferFraming('Prototype software. Not an offer. Informational only.'),
    true
  );
  assert.equal(
    hasNonOfferFraming('VIP tier available for qualified users.'),
    false
  );
});
