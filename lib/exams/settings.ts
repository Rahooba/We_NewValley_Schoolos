import { prisma } from '@/lib/prisma';

// Shared read of the configurable remedial cutoff (default 65%).
// The grade-tier bands in grade-tier.ts are a separate, fixed computation —
// never merge this threshold into GRADE_TIERS.
export async function getRemedialThresholdPercent(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'remedial_threshold_percent' }
  });
  return Number(setting?.value ?? '65');
}