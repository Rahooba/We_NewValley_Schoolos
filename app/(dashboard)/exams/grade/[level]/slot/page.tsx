import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GRADE_LABELS, SLOTS_BY_LEVEL, slotLabel, MAX_SLOT_SCORE } from '@/lib/examSlots';
import { SlotMarksForm } from './SlotMarksForm';

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

  const [classes, students, existing] = await Promise.all([
    prisma.class.findMany({ where: { level }, orderBy: { name: 'asc' } }),
    prisma.student.findMany({
      where: { status: 'ACTIVE', class: { level } },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.formativeAssessment.findMany({
      where: { gradeLevel: level, slot },
      select: { studentId: true, score: true, className: true }
    })
  ]);

  const scoresByClass = new Map<string, Map<string, number>>();
  for (const a of existing) {
    if (!scoresByClass.has(a.className ?? '')) scoresByClass.set(a.className ?? '', new Map());
    scoresByClass.get(a.className ?? '')?.set(a.studentId, Number(a.score));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/exams/grade/${level}`} className="text-xs text-brand hover:underline">
          ← {GRADE_LABELS[level]}
        </Link>
        <h1 className="text-2xl font-display mt-1">{slotLabel(slot)} — {GRADE_LABELS[level]}</h1>
        <p className="text-sm text-muted">
          أدخل درجة كل طالب من {MAX_SLOT_SCORE} (درجة واحدة لكل طالب، قابلة للتعديل)
        </p>
      </div>

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
      />
    </div>
  );
}