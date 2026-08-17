import type { SubjectTierReport } from './tier-report';

export interface SubjectHealth {
  subjectId: string;
  subjectName: string;
  passRatePercent: number; // % of students at or above the remedial threshold
  status: 'strong' | 'watch' | 'weak'; // strong ≥80%, watch ≥ threshold, weak < threshold
}

export function computeSubjectHealth(reports: SubjectTierReport[], remedialThreshold: number): SubjectHealth[] {
  return reports.map((r) => {
    const passRatePercent = r.totalStudents > 0 ? ((r.totalStudents - r.remedialCount) / r.totalStudents) * 100 : 0;
    const status = passRatePercent >= 80 ? 'strong' : passRatePercent >= remedialThreshold ? 'watch' : 'weak';
    return { subjectId: r.subjectId, subjectName: r.subjectName, passRatePercent, status };
  });
}