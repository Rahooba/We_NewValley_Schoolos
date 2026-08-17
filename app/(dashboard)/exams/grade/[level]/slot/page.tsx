import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GRADE_LABELS, SLOTS_BY_LEVEL, slotLabel, MAX_SLOT_SCORE } from '@/lib/examSlots';
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
      select: { studentId: true, score: true, maxScore: true, className: true }
    }),
    buildTierReport(level, slotDef.key),
    getRemedialThresholdPercent()
  ]);

  const scoresByClass = new Map<string, Map<string, number>>();
  let initialMaxScore = MAX_SLOT_SCORE;
  const maxScoreCounts = new Map<number, number>();
  for (const a of existing) {
    if (!scoresByClass.has(a.className ?? '')) scoresByClass.set(a.className ?? '', new Map());
    scoresByClass.get(a.className ?? '')?.set(a.studentId, Number(a.score));
    const ms = Number(a.maxScore);
    if (ms > 0) {
      maxScoreCounts.set(ms, (maxScoreCounts.get(ms) ?? 0) + 1);
    }
  }
  // Use the most common maxScore from existing records
  let maxCount = 0;
  for (const [ms, count] of maxScoreCounts) {
    if (count > maxCount) { maxCount = count; initialMaxScore = ms; }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/exams/grade/${level}`} className="text-xs text-brand hover:underline">
          ← {GRADE_LABELS[level]}
        </Link>
        <h1 className="text-2xl font-display mt-1">{slotLabel(slot)} — {GRADE_LABELS[level]}</h1>
        <p className="text-sm text-muted">
          أدخل درجة كل طالب — الدرجة القصوى قابلة للتعديل لكل مادة
        </p>
      </div>

      <SubjectHealthBar data={computeSubjectHealth(tierReport, remedialThreshold)} threshold={remedialThreshold} />

      <SlotMarksForm
        level={level}
        slot={slotDef.key}
        subject={slotDef.label}
        classes={classes.map((c) => c.name)}
        students={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode,
          className: s.class?.name ?? '',
          sectionName: s.section?.name ?? '—'
        }))}
        scoresByClass={scoresByClass}
        initialMaxScore={initialMaxScore}
      />

      <TierReportTable data={tierReport} />

      <RemedialLinkBanner gradeLevel={level} />
    </div>
  );
}