import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GRADE_LABELS, SLOTS_BY_LEVEL, slotLabel } from '@/lib/examSlots';
import { getRemedialThresholdPercent } from '@/lib/exams/settings';
import { buildTierReport } from '@/lib/exams/tier-report';
import { computeSubjectHealth } from '@/lib/exams/subject-health';
import { SlotMarksForm } from './SlotMarksForm';
import { TierReportTable } from './TierReportTable';
import { SubjectHealthBar } from './SubjectHealthBar';
import { RemedialLinkBanner } from './RemedialLinkBanner';

export const dynamic = 'force-dynamic';

export default async function SlotMarksPage({
  params,
  searchParams
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const [{ level: raw }, { slot }] = await Promise.all([params, searchParams]);
  const level = Number(raw);
  if (![1, 2, 3].includes(level) || !slot) notFound();

  const slots = SLOTS_BY_LEVEL[level];
  const slotDef = slots.find((s) => s.key === slot);
  if (!slotDef) notFound();

  const [classes, students, existing, tierReport, remedialThreshold] = await Promise.all([
    prisma.class.findMany({ where: { level }, orderBy: { name: 'asc' } }),
    prisma.student.findMany({
      where: { status: 'ACTIVE', class: { level } },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.formativeAssessment.findMany({
      where: { gradeLevel: level, slot },
      select: { studentId: true, subject: true, score: true, maxScore: true }
    }),
    buildTierReport(level, slotDef.key),
    getRemedialThresholdPercent()
  ]);

  // Build existingScores: studentId -> (subject -> score)
  const existingScores = new Map<string, Map<string, number>>();
  // Build existingMaxScores: subject -> maxScore (most common per subject)
  const maxScoreCounts = new Map<string, Map<number, number>>();
  for (const a of existing) {
    if (!existingScores.has(a.studentId)) existingScores.set(a.studentId, new Map());
    existingScores.get(a.studentId)!.set(a.subject, Number(a.score));
    if (!maxScoreCounts.has(a.subject)) maxScoreCounts.set(a.subject, new Map());
    const ms = Number(a.maxScore);
    const mc = maxScoreCounts.get(a.subject)!;
    mc.set(ms, (mc.get(ms) ?? 0) + 1);
  }
  const existingMaxScores = new Map<string, number>();
  for (const [subj, counts] of maxScoreCounts) {
    let bestMs = 100;
    let bestCount = 0;
    for (const [ms, count] of counts) {
      if (count > bestCount) { bestMs = ms; bestCount = count; }
    }
    existingMaxScores.set(subj, bestMs);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/exams/grade/${level}`} className="text-xs text-brand hover:underline">
          ← {GRADE_LABELS[level]}
        </Link>
        <h1 className="text-2xl font-display mt-1">{slotLabel(slot)} — {GRADE_LABELS[level]}</h1>
        <p className="text-sm text-muted">
          أدخل درجة كل طالب في جميع المواد — الدرجة القصوى 100 (ثابتة)
        </p>
      </div>

      <SubjectHealthBar data={computeSubjectHealth(tierReport, remedialThreshold)} threshold={remedialThreshold} />

      <SlotMarksForm
        level={level}
        slot={slotDef.key}
        classes={classes.map((c) => c.name)}
        students={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode,
          className: s.class?.name ?? '',
          sectionName: s.section?.name ?? '—'
        }))}
        existingScores={existingScores}
        existingMaxScores={existingMaxScores}
      />

      <TierReportTable data={tierReport} />

      <RemedialLinkBanner gradeLevel={level} />
    </div>
  );
}
