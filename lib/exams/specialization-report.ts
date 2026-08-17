import { prisma } from '@/lib/prisma';
import { getRemedialThresholdPercent } from './settings';
import { aggregateTierReport, type SubjectTierReport, type TierRow } from './tier-report';

// Fixed subject order matching the official Ministry report format (right-to-left in table headers)
export const SUBJECT_ORDER: string[] = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الفيزياء',
  'الرياضيات',
  'دراسات اجتماعية',
  'المواد الفنية التخصصية النظرية',
  'المواد الفنية التخصصية العملية',
  'الاقتصاد',
  'التدريب الميداني',
  'التربية الدينية'
];

export interface ScoreBandRow {
  subject: string;
  totalAttended: number;
  bandLT50: number;
  band50to65: number;
  band65to85: number;
  bandGT85: number;
  bandGE65: number;
  successCount: number;
  successRate: number;
}

export interface SpecializationGroup {
  className: string;
  totalStudents: number;
  tierReport: SubjectTierReport[];
  scoreBands: ScoreBandRow[];
  totalTierRow: SubjectTierReport;
  totalScoreBand: ScoreBandRow;
}

export interface SpecializationReport {
  specializations: SpecializationGroup[];
  allCombined: SpecializationGroup;
}

function buildScoreBands(rows: TierRow[], remedialThreshold: number): ScoreBandRow[] {
  const bySubject = new Map<string, TierRow[]>();
  for (const row of rows) {
    if (!bySubject.has(row.subject)) bySubject.set(row.subject, []);
    bySubject.get(row.subject)!.push(row);
  }

  return Array.from(bySubject.entries()).map(([subject, subjectRows]) => {
    let totalAttended = 0;
    let bandLT50 = 0;
    let band50to65 = 0;
    let band65to85 = 0;
    let bandGT85 = 0;
    let successCount = 0;

    for (const row of subjectRows) {
      if (row.maxScore <= 0) continue;
      const percent = (row.score / row.maxScore) * 100;
      totalAttended++;
      if (percent < 50) bandLT50++;
      else if (percent < 65) band50to65++;
      else if (percent < 85) band65to85++;
      else bandGT85++;
      if (percent >= remedialThreshold) successCount++;
    }

    const bandGE65 = band65to85 + bandGT85;
    const successRate = totalAttended > 0 ? (successCount / totalAttended) * 100 : 0;

    return { subject, totalAttended, bandLT50, band50to65, band65to85, bandGT85, bandGE65, successCount, successRate };
  });
}

function sortScoreBands(items: ScoreBandRow[]): ScoreBandRow[] {
  const orderMap = new Map(SUBJECT_ORDER.map((s, i) => [s, i]));
  return [...items].sort((a, b) => {
    const ai = orderMap.get(a.subject) ?? 999;
    const bi = orderMap.get(b.subject) ?? 999;
    return ai - bi;
  });
}

function sortTierReport(items: SubjectTierReport[]): SubjectTierReport[] {
  const orderMap = new Map(SUBJECT_ORDER.map((s, i) => [s, i]));
  return [...items].sort((a, b) => {
    const ai = orderMap.get(a.subjectName) ?? 999;
    const bi = orderMap.get(b.subjectName) ?? 999;
    return ai - bi;
  });
}

function computeTotalTierReport(reports: SubjectTierReport[], className: string): SubjectTierReport {
  const tierCounts = { EE: 0, ME: 0, NI: 0, UN: 0 } as Record<string, number>;
  let totalStudents = 0;
  let remedialCount = 0;
  let totalPercent = 0;
  let count = 0;

  for (const r of reports) {
    tierCounts.EE += r.tierCounts.EE;
    tierCounts.ME += r.tierCounts.ME;
    tierCounts.NI += r.tierCounts.NI;
    tierCounts.UN += r.tierCounts.UN;
    totalStudents += r.totalStudents;
    remedialCount += r.remedialCount;
    totalPercent += r.averagePercent * r.totalStudents;
    count += r.totalStudents;
  }

  return {
    subjectId: 'total',
    subjectName: 'المجموع',
    tierCounts: tierCounts as Record<'EE' | 'ME' | 'NI' | 'UN', number>,
    totalStudents,
    remedialCount,
    averagePercent: count > 0 ? totalPercent / count : 0
  };
}

function computeTotalScoreBand(bands: ScoreBandRow[]): ScoreBandRow {
  let totalAttended = 0;
  let bandLT50 = 0;
  let band50to65 = 0;
  let band65to85 = 0;
  let bandGT85 = 0;
  let successCount = 0;

  for (const b of bands) {
    totalAttended += b.totalAttended;
    bandLT50 += b.bandLT50;
    band50to65 += b.band50to65;
    band65to85 += b.band65to85;
    bandGT85 += b.bandGT85;
    successCount += b.successCount;
  }

  const bandGE65 = band65to85 + bandGT85;
  const successRate = totalAttended > 0 ? (successCount / totalAttended) * 100 : 0;

  return { subject: 'المجموع', totalAttended, bandLT50, band50to65, band65to85, bandGT85, bandGE65, successCount, successRate };
}

export async function buildSpecializationReport(gradeLevel: number): Promise<SpecializationReport> {
  const assessments = await prisma.formativeAssessment.findMany({
    where: { gradeLevel },
    select: { subject: true, score: true, maxScore: true, className: true, studentId: true }
  });

  const remedialThreshold = await getRemedialThresholdPercent();

  // Count unique students per className
  const studentsByClass = new Map<string, Set<string>>();
  for (const a of assessments) {
    const cn = a.className ?? 'غير محدد';
    if (!studentsByClass.has(cn)) studentsByClass.set(cn, new Set());
    studentsByClass.get(cn)!.add(a.studentId);
  }

  const allStudents = new Set(assessments.map((a) => a.studentId));

  const allRows: TierRow[] = assessments.map((a) => ({
    subject: a.subject,
    score: Number(a.score),
    maxScore: Number(a.maxScore)
  }));

  // Group by className
  const byClass = new Map<string, TierRow[]>();
  for (const a of assessments) {
    const cn = a.className ?? 'غير محدد';
    if (!byClass.has(cn)) byClass.set(cn, []);
    byClass.get(cn)!.push({
      subject: a.subject,
      score: Number(a.score),
      maxScore: Number(a.maxScore)
    });
  }

  const specializations: SpecializationGroup[] = Array.from(byClass.entries()).map(([className, rows]) => {
    const tierReport = sortTierReport(aggregateTierReport(rows, remedialThreshold));
    const scoreBands = sortScoreBands(buildScoreBands(rows, remedialThreshold));
    return {
      className,
      totalStudents: studentsByClass.get(className)?.size ?? 0,
      tierReport,
      scoreBands,
      totalTierRow: computeTotalTierReport(tierReport, className),
      totalScoreBand: computeTotalScoreBand(scoreBands)
    };
  });

  const allCombinedTierReport = sortTierReport(aggregateTierReport(allRows, remedialThreshold));
  const allCombinedScoreBands = sortScoreBands(buildScoreBands(allRows, remedialThreshold));

  const allCombined: SpecializationGroup = {
    className: 'جميع التخصصات',
    totalStudents: allStudents.size,
    tierReport: allCombinedTierReport,
    scoreBands: allCombinedScoreBands,
    totalTierRow: computeTotalTierReport(allCombinedTierReport, 'جميع التخصصات'),
    totalScoreBand: computeTotalScoreBand(allCombinedScoreBands)
  };

  return { specializations, allCombined };
}
