import { classifyScore, type GradeTier } from './grade-tier';
import { getRemedialThresholdPercent } from './settings';
import { prisma } from '@/lib/prisma';

export interface SubjectTierReport {
  subjectId: string;
  subjectName: string;
  tierCounts: Record<GradeTier, number>;
  totalStudents: number;
  remedialCount: number; // scored < remedial threshold on THIS assessment (informational, not the official remedial flag)
  averagePercent: number; // mean percentage score across scored students
}

export interface TierRow {
  subject: string;
  score: number;
  maxScore: number;
}

// One shared pure aggregation — consumed by the formative report (buildTierReport),
// the final-results report, and (via the remedial threshold) the health widget.
// Percentage-based throughout: never assumes a fixed max score.
export function aggregateTierReport(rows: TierRow[], remedialThreshold: number): SubjectTierReport[] {
  const bySubject = new Map<string, TierRow[]>();
  for (const row of rows) {
    if (!bySubject.has(row.subject)) bySubject.set(row.subject, []);
    bySubject.get(row.subject)!.push(row);
  }

  return Array.from(bySubject.entries()).map(([subjectName, subjectRows]) => {
    const tierCounts: Record<GradeTier, number> = { EE: 0, ME: 0, NI: 0, UN: 0 };
    let remedialCount = 0;
    let totalPercent = 0;
    let scored = 0;

    for (const row of subjectRows) {
      if (row.maxScore <= 0) continue;
      const percent = (row.score / row.maxScore) * 100;
      tierCounts[classifyScore(row.score, row.maxScore)]++;
      if (percent < remedialThreshold) remedialCount++;
      totalPercent += percent;
      scored++;
    }

    return {
      subjectId: subjectName,
      subjectName,
      tierCounts,
      totalStudents: tierCounts.EE + tierCounts.ME + tierCounts.NI + tierCounts.UN,
      remedialCount,
      averagePercent: scored > 0 ? totalPercent / scored : 0
    };
  });
}

// Formative-slot report: one query for the whole slot, aggregated in memory —
// a single grade+slot is a small, naturally bounded dataset (students × subjects),
// so N+1 per-subject queries would be strictly worse here.
export async function buildTierReport(gradeLevel: number, slot: string): Promise<SubjectTierReport[]> {
  const rows = await prisma.formativeAssessment.findMany({
    where: { gradeLevel, slot },
    select: { subject: true, score: true, maxScore: true }
  });

  const remedialThreshold = await getRemedialThresholdPercent();

  return aggregateTierReport(
    rows.map((r) => ({ subject: r.subject, score: Number(r.score), maxScore: Number(r.maxScore) })),
    remedialThreshold
  );
}