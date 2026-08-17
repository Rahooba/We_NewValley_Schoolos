export type GradeTier = 'EE' | 'ME' | 'NI' | 'UN';

export interface TierRange {
  tier: GradeTier;
  label: string;
  min: number;
  max: number;
}

// Fixed thresholds matching the official Ministry report format —
// these are NOT the same as the remedial threshold (remedial_threshold_percent).
export const GRADE_TIERS: TierRange[] = [
  { tier: 'EE', label: 'ممتاز', min: 80, max: 100 },
  { tier: 'ME', label: 'جيد جداً', min: 50, max: 79.9 },
  { tier: 'NI', label: 'يحتاج تحسين', min: 30, max: 49.9 },
  { tier: 'UN', label: 'غير مرضٍ', min: 0, max: 29.9 }
];

export function classifyScore(score: number, maxScore: number): GradeTier {
  const percent = (score / maxScore) * 100;
  const tier = GRADE_TIERS.find((t) => percent >= t.min && percent <= t.max);
  if (!tier) throw new Error(`Score ${score}/${maxScore} (${percent}%) didn't match any tier — check boundary logic`);
  return tier.tier;
}