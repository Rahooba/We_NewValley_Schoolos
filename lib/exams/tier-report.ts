import { classifyScore, type GradeTier } from './grade-tier';
import { getRemedialThresholdPercent } from './settings';
import { prisma } from '@/lib/prisma';

export interface SubjectTierReport {
  subjectId: string;
  subjectName: string;
  tierCounts: Record<GradeTier, number>;
  totalStudents: number;
  remedialCount: number; // scored < remedial threshold on THIS assessment (informational, not the official remedial flag)
}

// One query for the whole slot, grouped in memory — a single grade+slot is a
// small, naturally bounded dataset (students × subjects), so N+1 per-subject
// queries would be strictly worse here.
export async function buildTierReport(gradeLevel: number, slot: string): Promise<SubjectTierReport[]> {
  const rows = await prisma.formativeAssessment.findMany({
    where: { gradeLevel, slot },
    select: { subject: true, score: true, maxScore: true }
  });

  const bySubject = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    const key = row.subject;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(row);
  }

  const remedialThreshold = await getRemedialThresholdPercent();

  return Array.from(bySubject.entries()).map(([subjectName, subjectRows]) => {
    const tierCounts: Record<GradeTier, number> = { EE: 0, ME: 0, NI: 0, UN: 0 };
    let remedialCount = 0;

    for (const row of subjectRows) {
      const maxScore = Number(row.maxScore);
      if (maxScore <= 0) continue;
      const percent = (Number(row.score) / maxScore) * 100;
      tierCounts[classifyScore(Number(row.score), maxScore)]++;
      if (percent < remedialThreshold) remedialCount++;
    }

    return {
      subjectId: subjectName,
      subjectName,
      tierCounts,
      totalStudents: tierCounts.EE + tierCounts.ME + tierCounts.NI + tierCounts.UN,
      remedialCount
    };
  });
}