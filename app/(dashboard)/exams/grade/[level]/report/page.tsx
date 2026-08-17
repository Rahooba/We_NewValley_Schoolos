import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRemedialThresholdPercent } from '@/lib/exams/settings';
import { buildSpecializationReport } from '@/lib/exams/specialization-report';
import { GRADE_LABELS } from '@/lib/examSlots';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';
import { ReportTypeA } from './ReportTypeA';
import { ReportTypeB } from './ReportTypeB';
import { TierBarChart } from './TierBarChart';
import { SpecializationTabs } from './SpecializationTabs';

export const dynamic = 'force-dynamic';

export default async function ExamReportPage({
  params,
  searchParams
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ spec?: string }>;
}) {
  const { level: raw } = await params;
  const { spec: selectedSpec } = await searchParams;
  const level = Number(raw);
  if (![1, 2, 3].includes(level)) notFound();

  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('exams.view')) redirect('/dashboard/forbidden');

  const [report, remedialThreshold] = await Promise.all([
    buildSpecializationReport(level),
    getRemedialThresholdPercent()
  ]);

  // Pick which specialization to show
  const allGroups = [report.allCombined, ...report.specializations];
  const activeGroup = allGroups.find((g) => g.className === selectedSpec) ?? report.allCombined;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/exams/grade/${level}`} className="text-xs text-brand hover:underline">
          ← {GRADE_LABELS[level]}
        </Link>
        <h1 className="text-2xl font-display mt-1">التقرير التحليلي — {GRADE_LABELS[level]}</h1>
      </div>

      <SpecializationTabs
        groups={allGroups}
        activeClassName={activeGroup.className}
        baseUrl={`/exams/grade/${level}/report`}
      />

      <div className="print:break-before-page">
        <ReportHeader
          title={`النسبة التحليلية العامة للصف ${level === 1 ? 'الأول' : level === 2 ? 'الثاني' : 'الثالث'} للعام الدراسي 2025 / 2026`}
          subtitle={activeGroup.className === 'جميع التخصصات' ? 'جميع التخصصات' : `تخصص ${activeGroup.className}`}
        />

        <ReportTypeA group={activeGroup} gradeLevel={level} remedialThreshold={remedialThreshold} />

        <div className="print:break-before-page mt-6">
          <h2 className="text-lg font-bold text-center mb-4">
            النسبة التحليلية للنتيجة 2025 / 2026 {activeGroup.className === 'جميع التخصصات' ? 'جميع التخصصات' : `تخصص ${activeGroup.className}`}
          </h2>
          <TierBarChart data={activeGroup.tierReport} />
        </div>

        <div className="print:break-before-page mt-6">
          <ReportTypeB group={activeGroup} gradeLevel={level} remedialThreshold={remedialThreshold} />
        </div>

        <ReportFooter />
      </div>
    </div>
  );
}
