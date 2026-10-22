import type { Nutrition } from '@/api/schemas';

export type BalancedChoiceTone = 'strong' | 'balanced' | 'consider';

export interface BalancedChoice {
  score: number;
  label: string;
  tone: BalancedChoiceTone;
  highlights: string[];
}

/**
 * A transparent, per-serving estimate for comparing choices in this app.
 *
 * This is deliberately not a clinical, government, or branded food rating.
 * It only appears where all of the inputs that influence the score are present.
 */
export function getBalancedChoice(nutrition: Nutrition): BalancedChoice | null {
  const { calories, saturatedFatG, sodiumMg, sugarG, fiberG, proteinG } = nutrition;
  if (
    !Number.isFinite(calories) ||
    saturatedFatG == null ||
    sodiumMg == null ||
    sugarG == null ||
    fiberG == null
  ) {
    return null;
  }

  let score = 55;
  const highlights: string[] = [];

  if (proteinG != null) {
    if (proteinG >= 20) {
      score += 15;
      highlights.push(`${proteinG}g protein`);
    } else if (proteinG >= 10) {
      score += 8;
      highlights.push(`${proteinG}g protein`);
    }
  }

  if (fiberG >= 8) {
    score += 12;
    highlights.push(`${fiberG}g fiber`);
  } else if (fiberG >= 4) {
    score += 8;
    highlights.push(`${fiberG}g fiber`);
  } else if (fiberG >= 2) {
    score += 3;
  }

  if (calories >= 900) score -= 10;
  else if (calories >= 650) score -= 5;

  if (saturatedFatG >= 10) score -= 15;
  else if (saturatedFatG >= 5) score -= 8;

  if (sodiumMg >= 1_000) score -= 15;
  else if (sodiumMg >= 600) score -= 8;

  if (sugarG >= 25) score -= 10;
  else if (sugarG >= 12) score -= 5;

  score = Math.max(0, Math.min(100, score));

  if (sodiumMg >= 600) highlights.push(`${sodiumMg}mg sodium`);
  if (saturatedFatG >= 5) highlights.push(`${saturatedFatG}g saturated fat`);
  if (sugarG >= 12) highlights.push(`${sugarG}g sugar`);

  if (score >= 75) return { score, label: 'More nutrient-forward', tone: 'strong', highlights };
  if (score >= 50) return { score, label: 'Balanced choice', tone: 'balanced', highlights };
  return { score, label: 'Consider the full nutrition', tone: 'consider', highlights };
}
