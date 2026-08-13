import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { VisitForm, KPIForm, RiskForm } from './QuickForms';
import {
  updateVisit,
  deleteVisit,
  updateKPI,
  deleteKPI,
  updateRisk,
  deleteRisk
} from './actions';

const PAGE_SIZE = 25;

export default async function QualityPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('quality.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [visits, total, kpis, risks] = await Promise.all([
    prisma.visit.findMany({
      orderBy: { visitedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.visit.count(),
    prisma.kPI.findMany({ orderBy: { period: 'desc' } }),
    prisma.risk.findMany({ orderBy: { severity: 'desc' } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subLinks = [
    { href: '/quality/improvement-plans', label: 'خطط التحسين' },
    { href: '/quality/visits/schedule', label: 'جدول الزيارات' },
    { href: '/quality/warnings', label: 'إنذارات الغياب' },
    { href: '/quality/broadcast', label: 'الإذاعة المدرسية' },
    { href: '/quality/cleanliness', label: 'متابعة النظافة' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">الجودة</h1>
        <p className="text-sm text-muted">نظام إدارة الجودة والمتابعة</p>
      </div>

      <section className="flex flex-wrap gap-2">
        {subLinks.map((l) => (
          <Link key={l.href} href={l.href} className="card px-4 py-2 text-sm hover:border-brand">
            {l.label}
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">الزيارات</h2>
        <VisitForm />
        <ManageRows
          columns={[
            { key: 'visitedAtDisplay', label: 'التاريخ' },
            { key: 'visitor', label: 'الزائر' },
            { key: 'purpose', label: 'الغرض' },
            { key: 'status', label: 'الحالة' },
            { key: 'notes', label: 'ملاحظات' }
          ]}
          rows={visits.map((v) => ({
            id: v.id,
            plannedVisitDate: v.plannedVisitDate ? v.plannedVisitDate.toISOString() : '',
            visitedAt: v.visitedAt ? v.visitedAt.toISOString() : '',
            visitedAtDisplay: (v.visitedAt ?? v.plannedVisitDate)
              ? new Date(v.visitedAt ?? v.plannedVisitDate!).toLocaleDateString('ar-EG')
              : '—',
            visitor: v.visitor,
            purpose: v.purpose ?? '',
            status: v.status,
            notes: v.notes ?? ''
          }))}
          fields={
            [
              { name: 'plannedVisitDate', label: 'الزيارة المجدولة', type: 'date' },
              { name: 'visitedAt', label: 'تاريخ التنفيذ', type: 'date' },
              { name: 'visitor', label: 'اسم الزائر', type: 'text', required: true },
              { name: 'purpose', label: 'الغرض', type: 'text' },
              {
                name: 'status',
                label: 'الحالة',
                type: 'select',
                options: [
                  { value: 'scheduled', label: 'مجدولة' },
                  { value: 'completed', label: 'منفذة' },
                  { value: 'cancelled', label: 'ملغاة' }
                ]
              },
              { name: 'notes', label: 'ملاحظات', type: 'textarea' }
            ] satisfies ManageField[]
          }
          updateAction={updateVisit}
          deleteAction={deleteVisit}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد زيارات بعد"
        />
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">مؤشرات الأداء (KPIs)</h2>
        <KPIForm />
        <ManageRows
          columns={[
            { key: 'name', label: 'المؤشر' },
            { key: 'target', label: 'الهدف' },
            { key: 'actual', label: 'الفعلي' },
            { key: 'period', label: 'الفترة' }
          ]}
          rows={kpis.map((k) => ({
            id: k.id,
            name: k.name,
            target: Number(k.target),
            actual: k.actual ? Number(k.actual) : '—',
            period: k.period
          }))}
          fields={
            [
              { name: 'name', label: 'اسم المؤشر', type: 'text', required: true },
              { name: 'target', label: 'الهدف', type: 'number', required: true, step: '0.01' },
              { name: 'actual', label: 'الفعلي', type: 'number', step: '0.01' },
              { name: 'period', label: 'الفترة', type: 'text', required: true }
            ] satisfies ManageField[]
          }
          updateAction={updateKPI}
          deleteAction={deleteKPI}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد مؤشرات بعد"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">المخاطر</h2>
        <RiskForm />
        <ManageRows
          columns={[
            { key: 'title', label: 'العنوان' },
            { key: 'severity', label: 'الخطورة' },
            { key: 'mitigation', label: 'الإجراء المقترح' }
          ]}
          rows={risks.map((r) => ({
            id: r.id,
            title: r.title,
            severity: r.severity,
            mitigation: r.mitigation ?? ''
          }))}
          fields={
            [
              { name: 'title', label: 'العنوان', type: 'text', required: true },
              { name: 'severity', label: 'درجة الخطورة', type: 'text', required: true },
              { name: 'description', label: 'الوصف', type: 'textarea' },
              { name: 'mitigation', label: 'الإجراء المقترح', type: 'textarea' }
            ] satisfies ManageField[]
          }
          updateAction={updateRisk}
          deleteAction={deleteRisk}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد مخاطر مسجلة بعد"
        />
      </section>
    </div>
  );
}
