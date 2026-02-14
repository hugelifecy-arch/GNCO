import { computeNodeFit } from './scoring';
import type { FundNode } from '../types';

const baseNode: FundNode = {
  id: 'L1::TEST',
  layer: 1,
  label: 'Test Node',
  summary: 'test summary',
  data: {
    jurisdiction: 'LUX',
    advantages: [],
    disadvantages: [],
    sources: [],
    tags: ['EU_PASSPORT', 'TOKENIZATION'],
    factorScores: {
      speed: 80,
      governance: 75,
      familiarity: 60,
      cost: 30,
      conservatism: 55,
      digital: 70
    }
  },
  children: []
};

const baseWeights = {
  speed: 25,
  cost: 25,
  governance: 25,
  digital: 25
};

const baseConstraints = {
  EU_PASSPORT: false,
  TOKENIZATION: false,
  CRYPTO_FINANCING: false
};

describe('computeNodeFit', () => {
  it('returns expected fit output for a valid success case', () => {
    const result = computeNodeFit(baseNode, baseWeights, baseConstraints);

    expect(result).toMatchObject({
      fitScore: 73.75,
      penalty: 0,
      isDisabled: false,
      missingTags: [],
      rawScore: 73.75,
      breakdown: {
        speed: 80,
        cost: 70,
        governance: 75,
        digital: 70
      }
    });
  });

  it('throws when required arguments are null/undefined', () => {
    expect(() => computeNodeFit(null as unknown as FundNode, baseWeights, baseConstraints)).toThrow();
    expect(() => computeNodeFit(baseNode, undefined as never, baseConstraints)).toThrow();
    expect(() => computeNodeFit(baseNode, baseWeights, null as never)).toThrow();
  });

  it('handles edge cases: negative numbers and empty-string constraints', () => {
    const edgeNode = {
      ...baseNode,
      data: {
        ...baseNode.data,
        tags: [''],
        factorScores: {
          ...baseNode.data.factorScores,
          speed: -10,
          cost: -20,
          governance: -30,
          digital: -40
        }
      }
    };

    const edgeWeights = {
      speed: -1,
      cost: -1,
      governance: -1,
      digital: -1
    };

    const edgeConstraints = {
      ...baseConstraints,
      TOKENIZATION: true
    };

    const result = computeNodeFit(edgeNode, edgeWeights, edgeConstraints);

    expect(result.rawScore).toBe(10);
    expect(result.penalty).toBe(-35);
    expect(result.fitScore).toBe(0);
    expect(result.isDisabled).toBe(true);
    expect(result.missingTags).toEqual(['TOKENIZATION']);
  });
});
