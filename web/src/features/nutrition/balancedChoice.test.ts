import { describe, expect, it } from 'vitest';
import { getBalancedChoice } from './balancedChoice';

const standard = {
  calories: 480,
  proteinG: 12,
  carbsG: 40,
  fatG: 14,
  saturatedFatG: 3,
  sodiumMg: 380,
  sugarG: 8,
  fiberG: 5,
};

describe('getBalancedChoice', () => {
  it('rewards listed protein and fiber while considering risk nutrients', () => {
    expect(getBalancedChoice(standard)).toMatchObject({
      score: 71,
      label: 'Balanced choice',
      tone: 'balanced',
    });
  });

  it('does not calculate a score when a required input is missing', () => {
    expect(getBalancedChoice({ ...standard, fiberG: undefined })).toBeNull();
  });

  it('lowers the score for high sodium, sugar, saturated fat, and calories', () => {
    expect(
      getBalancedChoice({
        ...standard,
        calories: 950,
        saturatedFatG: 11,
        sodiumMg: 1_100,
        sugarG: 28,
        fiberG: 1,
        proteinG: 5,
      }),
    ).toMatchObject({ score: 5, tone: 'consider' });
  });
});
