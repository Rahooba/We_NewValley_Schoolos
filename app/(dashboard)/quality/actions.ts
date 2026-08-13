'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

async function requireVisitPermission() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && (permissions.includes('quality.manage') || permissions.includes('visit_schedule.manage'));
}

export type ActionState = { error?: string; success?: boolean };

export async function createVisit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireVisitPermission())) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    plannedVisitDate: z.string().optional().or(z.literal('')),
    visitedAt: z.string().optional().or(z.literal('')),
    visitor: z.string().min(2, 'اسم الزائر مطلوب'),
    purpose: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    status: z.string().optional().or(z.literal('')),
    employeeId: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    plannedVisitDate: String(formData.get('plannedVisitDate') ?? ''),
    visitedAt: String(formData.get('visitedAt') ?? ''),
    visitor: String(formData.get('visitor') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim(),
    notes: String(formData.get('notes') ?? '').trim(),
    status: String(formData.get('status') ?? ''),
    employeeId: String(formData.get('employeeId') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  const status = parsed.data.status || (parsed.data.visitedAt ? 'completed' : 'scheduled');
  try {
    await prisma.visit.create({
      data: {
        plannedVisitDate: parsed.data.plannedVisitDate ? new Date(parsed.data.plannedVisitDate) : null,
        visitedAt: parsed.data.visitedAt ? new Date(parsed.data.visitedAt) : null,
        visitor: parsed.data.visitor,
        purpose: parsed.data.purpose || null,
        notes: parsed.data.notes || null,
        status,
        employeeId: parsed.data.employeeId || null
      }
    });
  } catch (err) {
    console.error('createVisit failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  revalidatePath('/quality/visits/schedule');
  return {};
}

export async function createImprovementPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    title: z.string().min(2, 'العنوان مطلوب'),
    description: z.string().optional().or(z.literal('')),
    dueDate: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.improvementPlan.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
      }
    });
  } catch (err) {
    console.error('createImprovementPlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return {};
}

export async function createKPI(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    name: z.string().min(2, 'اسم المؤشر مطلوب'),
    target: z.string().min(1, 'الهدف مطلوب'),
    actual: z.string().optional().or(z.literal('')),
    period: z.string().min(1, 'الفترة مطلوبة')
  });
  const parsed = schema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    target: String(formData.get('target') ?? ''),
    actual: String(formData.get('actual') ?? ''),
    period: String(formData.get('period') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.kPI.create({
      data: {
        name: parsed.data.name,
        target: Number(parsed.data.target),
        actual: parsed.data.actual ? Number(parsed.data.actual) : null,
        period: parsed.data.period
      }
    });
  } catch (err) {
    console.error('createKPI failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return {};
}

export async function createRisk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    title: z.string().min(2, 'العنوان مطلوب'),
    severity: z.string().min(1, 'درجة الخطورة مطلوبة'),
    description: z.string().optional().or(z.literal('')),
    mitigation: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    severity: String(formData.get('severity') ?? ''),
    description: String(formData.get('description') ?? '').trim(),
    mitigation: String(formData.get('mitigation') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.risk.create({
      data: {
        title: parsed.data.title,
        severity: parsed.data.severity,
        description: parsed.data.description || null,
        mitigation: parsed.data.mitigation || null
      }
    });
  } catch (err) {
    console.error('createRisk failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return {};
}

// ---------------- Visit edit/delete ----------------

const visitSchema = z.object({
  plannedVisitDate: z.string().optional().or(z.literal('')),
  visitedAt: z.string().optional().or(z.literal('')),
  visitor: z.string().min(2, 'اسم الزائر مطلوب'),
  purpose: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal(''))
});

export async function updateVisit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireVisitPermission())) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = visitSchema.safeParse({
    plannedVisitDate: String(formData.get('plannedVisitDate') ?? ''),
    visitedAt: String(formData.get('visitedAt') ?? ''),
    visitor: String(formData.get('visitor') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim(),
    notes: String(formData.get('notes') ?? '').trim(),
    status: String(formData.get('status') ?? ''),
    employeeId: String(formData.get('employeeId') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const status =
    parsed.data.status || (parsed.data.visitedAt ? 'completed' : parsed.data.plannedVisitDate ? 'scheduled' : 'scheduled');

  try {
    await prisma.visit.update({
      where: { id },
      data: {
        plannedVisitDate: parsed.data.plannedVisitDate ? new Date(parsed.data.plannedVisitDate) : null,
        visitedAt: parsed.data.visitedAt ? new Date(parsed.data.visitedAt) : null,
        visitor: parsed.data.visitor,
        purpose: parsed.data.purpose || null,
        notes: parsed.data.notes || null,
        status,
        employeeId: parsed.data.employeeId || null
      }
    });
  } catch (err) {
    console.error('updateVisit failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  revalidatePath('/quality/visits/schedule');
  return { success: true };
}

export async function deleteVisit(id: string) {
  if (!(await requireVisitPermission())) return;
  await prisma.visit.delete({ where: { id } });
  revalidatePath('/quality');
  revalidatePath('/quality/visits/schedule');
}

export async function markVisitComplete(id: string) {
  if (!(await requireVisitPermission())) return;
  await prisma.visit.update({
    where: { id },
    data: { visitedAt: new Date(), status: 'completed' }
  });
  revalidatePath('/quality/visits/schedule');
  revalidatePath('/quality');
}

// ---------------- Improvement plan edit/delete ----------------

const planSchema = z.object({
  title: z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal(''))
});

export async function updatePlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = planSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    status: String(formData.get('status') ?? 'open')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.improvementPlan.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status || 'open'
      }
    });
  } catch (err) {
    console.error('updatePlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return { success: true };
}

export async function deletePlan(id: string) {
  if (!(await requireVisitPermission())) return;
  await prisma.improvementPlan.delete({ where: { id } });
  revalidatePath('/quality');
}

// ---------------- KPI edit/delete ----------------

const kpiSchema = z.object({
  name: z.string().min(2, 'اسم المؤشر مطلوب'),
  target: z.string().min(1, 'الهدف مطلوب'),
  actual: z.string().optional().or(z.literal('')),
  period: z.string().min(1, 'الفترة مطلوبة')
});

export async function updateKPI(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = kpiSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    target: String(formData.get('target') ?? ''),
    actual: String(formData.get('actual') ?? ''),
    period: String(formData.get('period') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.kPI.update({
      where: { id },
      data: {
        name: parsed.data.name,
        target: Number(parsed.data.target),
        actual: parsed.data.actual ? Number(parsed.data.actual) : null,
        period: parsed.data.period
      }
    });
  } catch (err) {
    console.error('updateKPI failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return { success: true };
}

export async function deleteKPI(id: string) {
  if (!(await requireVisitPermission())) return;
  await prisma.kPI.delete({ where: { id } });
  revalidatePath('/quality');
}

// ---------------- Risk edit/delete ----------------

const riskSchema = z.object({
  title: z.string().min(2, 'العنوان مطلوب'),
  severity: z.string().min(1, 'درجة الخطورة مطلوبة'),
  description: z.string().optional().or(z.literal('')),
  mitigation: z.string().optional().or(z.literal(''))
});

export async function updateRisk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('quality.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = riskSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    severity: String(formData.get('severity') ?? ''),
    description: String(formData.get('description') ?? '').trim(),
    mitigation: String(formData.get('mitigation') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.risk.update({
      where: { id },
      data: {
        title: parsed.data.title,
        severity: parsed.data.severity,
        description: parsed.data.description || null,
        mitigation: parsed.data.mitigation || null
      }
    });
  } catch (err) {
    console.error('updateRisk failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality');
  return { success: true };
}

export async function deleteRisk(id: string) {
  if (!(await requireVisitPermission())) return;
  await prisma.risk.delete({ where: { id } });
  revalidatePath('/quality');
}
