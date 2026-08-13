'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const employeeSchema = z.object({
  employeeCode: z.string().min(1, 'كود الموظف مطلوب'),
  fullName: z.string().min(3, 'الاسم مطلوب'),
  position: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  employmentCategory: z.enum(['contract', 'government']).default('contract'),
  startDate: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  contractType: z.string().optional().or(z.literal(''))
});

export type CreateEmployeeState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ActionState = { error?: string; success?: boolean };

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes(permission)) {
    return false;
  }
  return true;
}

export async function createEmployee(
  _prevState: CreateEmployeeState,
  formData: FormData
): Promise<CreateEmployeeState> {
  const allowed = await requirePermission('hr.create');
  if (!allowed) return { error: 'ليس لديك صلاحية إضافة موظف' };

  const raw = {
    employeeCode: String(formData.get('employeeCode') ?? '').trim(),
    fullName: String(formData.get('fullName') ?? '').trim(),
    position: String(formData.get('position') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
    employmentCategory: String(formData.get('employmentCategory') ?? 'contract').trim(),
    startDate: String(formData.get('startDate') ?? ''),
    salary: String(formData.get('salary') ?? ''),
    contractType: String(formData.get('contractType') ?? '').trim()
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: 'من فضلك راجع البيانات المدخلة', fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.employee.findUnique({ where: { employeeCode: data.employeeCode } });
  if (existing) {
    return { error: 'كود الموظف مستخدم بالفعل', fieldErrors: { employeeCode: 'هذا الكود مستخدم من قبل' } };
  }

  try {
    await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        position: data.position || null,
        department: data.department || null,
        employmentCategory: data.employmentCategory,
        status: 'ACTIVE',
        ...(data.startDate && data.salary
          ? {
              contracts: {
                create: [
                  {
                    startDate: new Date(data.startDate),
                    salary: Number(data.salary),
                    type: data.contractType || null
                  }
                ]
              }
            }
          : {})
      }
    });
  } catch (err) {
    console.error('createEmployee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى' };
  }

  revalidatePath('/hr');
  redirect('/hr');
}

export type UpdateEmployeeState = CreateEmployeeState;

export async function updateEmployee(
  _prevState: UpdateEmployeeState,
  formData: FormData
): Promise<UpdateEmployeeState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية تعديل موظف' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات الموظف غير صحيحة' };

  const raw = {
    employeeCode: String(formData.get('employeeCode') ?? '').trim(),
    fullName: String(formData.get('fullName') ?? '').trim(),
    position: String(formData.get('position') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
    employmentCategory: String(formData.get('employmentCategory') ?? 'contract').trim(),
    startDate: String(formData.get('startDate') ?? ''),
    salary: String(formData.get('salary') ?? ''),
    contractType: String(formData.get('contractType') ?? '').trim(),
    status: String(formData.get('status') ?? 'ACTIVE')
  };

  const parsed = employeeSchema.extend({ status: z.enum(['ACTIVE', 'INACTIVE']) }).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: 'من فضلك راجع البيانات المدخلة', fieldErrors };
  }

  const data = parsed.data;
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return { error: 'الموظف غير موجود' };

  const codeConflict = await prisma.employee.findFirst({
    where: { employeeCode: data.employeeCode, id: { not: id } }
  });
  if (codeConflict) {
    return { error: 'كود الموظف مستخدم بالفعل', fieldErrors: { employeeCode: 'هذا الكود مستخدم من قبل' } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: {
          employeeCode: data.employeeCode,
          fullName: data.fullName,
          position: data.position || null,
          department: data.department || null,
          employmentCategory: data.employmentCategory,
          status: data.status
        }
      });

      const contracts = await tx.contract.findMany({ where: { employeeId: id }, orderBy: { startDate: 'asc' } });
      if (data.startDate && data.salary) {
        if (contracts[0]) {
          await tx.contract.update({
            where: { id: contracts[0].id },
            data: {
              startDate: new Date(data.startDate),
              salary: Number(data.salary),
              type: data.contractType || null
            }
          });
        } else {
          await tx.contract.create({
            data: {
              employeeId: id,
              startDate: new Date(data.startDate),
              salary: Number(data.salary),
              type: data.contractType || null
            }
          });
        }
      }
    });
  } catch (err) {
    console.error('updateEmployee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى' };
  }

  revalidatePath('/hr');
  revalidatePath(`/hr/${id}/edit`);
  redirect(`/hr/${id}/edit`);
}

export async function deleteEmployee(id: string) {
  const allowed = await requirePermission('hr.delete');
  if (!allowed) return;
  await prisma.employee.delete({ where: { id } });
  revalidatePath('/hr');
}

// ---------------- Contracts (secondary, managed inside the employee edit page) ----------------

const contractSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  salary: z.string().min(1, 'المرتب مطلوب'),
  type: z.string().optional().or(z.literal(''))
});

export async function addContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = contractSchema.safeParse({
    employeeId: String(formData.get('employeeId') ?? ''),
    startDate: String(formData.get('startDate') ?? ''),
    salary: String(formData.get('salary') ?? ''),
    type: String(formData.get('type') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.contract.create({
      data: {
        employeeId: parsed.data.employeeId,
        startDate: new Date(parsed.data.startDate),
        salary: Number(parsed.data.salary),
        type: parsed.data.type || null
      }
    });
  } catch (err) {
    console.error('addContract failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath(`/hr/${parsed.data.employeeId}/edit`);
  return { success: true };
}

const updateContractSchema = z.object({
  id: z.string().min(1),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  salary: z.string().min(1, 'المرتب مطلوب'),
  type: z.string().optional().or(z.literal(''))
});

export async function updateContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = updateContractSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    startDate: String(formData.get('startDate') ?? ''),
    salary: String(formData.get('salary') ?? ''),
    type: String(formData.get('type') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    const contract = await prisma.contract.update({
      where: { id: parsed.data.id },
      data: {
        startDate: new Date(parsed.data.startDate),
        salary: Number(parsed.data.salary),
        type: parsed.data.type || null
      }
    });
    revalidatePath(`/hr/${contract.employeeId}/edit`);
  } catch (err) {
    console.error('updateContract failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  return { success: true };
}

export async function deleteContract(id: string) {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return;
  await prisma.contract.delete({ where: { id } });
  revalidatePath(`/hr/${contract.employeeId}/edit`);
}

// ---------------- Leaves ----------------

const CONTRACT_LEAVE_TYPES = ['contract_excused', 'contract_unexcused'];
const GOVERNMENT_LEAVE_TYPES = ['government_casual', 'government_regular'];

const leaveSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(['contract_excused', 'contract_unexcused', 'government_casual', 'government_regular'], {
    error: 'نوع الإجازة مطلوب'
  }),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  reason: z.string().optional().or(z.literal(''))
});

export async function addLeave(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = leaveSchema.safeParse({
    employeeId: String(formData.get('employeeId') ?? ''),
    leaveType: String(formData.get('leaveType') ?? ''),
    startDate: String(formData.get('startDate') ?? ''),
    endDate: String(formData.get('endDate') ?? ''),
    reason: String(formData.get('reason') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const employee = await prisma.employee.findUnique({
    where: { id: parsed.data.employeeId },
    select: { employmentCategory: true }
  });
  if (!employee) return { error: 'الموظف غير موجود' };

  const validTypes = employee.employmentCategory === 'government'
    ? GOVERNMENT_LEAVE_TYPES
    : CONTRACT_LEAVE_TYPES;
  if (!validTypes.includes(parsed.data.leaveType)) {
    return { error: 'نوع الإجازة غير متوافق مع فئة الموظف' };
  }

  try {
    await prisma.leave.create({
      data: {
        employeeId: parsed.data.employeeId,
        leaveType: parsed.data.leaveType,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        reason: parsed.data.reason || null
      }
    });
  } catch (err) {
    console.error('addLeave failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath(`/hr/${parsed.data.employeeId}/edit`);
  revalidatePath('/hr/leaves');
  return { success: true };
}

const updateLeaveSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
});

export async function updateLeave(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = updateLeaveSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    status: String(formData.get('status') ?? 'PENDING')
  });
  if (!parsed.success) return { error: 'بيانات غير صحيحة' };

  const session = await auth();
  const userId = session?.user?.id ?? null;

  try {
    const leave = await prisma.leave.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === 'APPROVED' && userId
          ? { approvedBy: userId }
          : {})
      }
    });
    revalidatePath(`/hr/${leave.employeeId}/edit`);
    revalidatePath('/hr/leaves');
  } catch (err) {
    console.error('updateLeave failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  return { success: true };
}

export async function deleteLeave(id: string) {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return;
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (!leave) return;
  await prisma.leave.delete({ where: { id } });
  revalidatePath(`/hr/${leave.employeeId}/edit`);
  revalidatePath('/hr/leaves');
}

// ---------------- Evaluations ----------------

const evaluationSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().min(1, 'الفترة مطلوبة'),
  score: z.string().min(1, 'الدرجة مطلوبة'),
  notes: z.string().optional().or(z.literal(''))
});

export async function addEvaluation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = evaluationSchema.safeParse({
    employeeId: String(formData.get('employeeId') ?? ''),
    period: String(formData.get('period') ?? '').trim(),
    score: String(formData.get('score') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.evaluation.create({
      data: {
        employeeId: parsed.data.employeeId,
        period: parsed.data.period,
        score: Number(parsed.data.score),
        notes: parsed.data.notes || null
      }
    });
  } catch (err) {
    console.error('addEvaluation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath(`/hr/${parsed.data.employeeId}/edit`);
  return { success: true };
}

const updateEvaluationSchema = z.object({
  id: z.string().min(1),
  period: z.string().min(1, 'الفترة مطلوبة'),
  score: z.string().min(1, 'الدرجة مطلوبة'),
  notes: z.string().optional().or(z.literal(''))
});

export async function updateEvaluation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = updateEvaluationSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    period: String(formData.get('period') ?? '').trim(),
    score: String(formData.get('score') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    const evaluation = await prisma.evaluation.update({
      where: { id: parsed.data.id },
      data: {
        period: parsed.data.period,
        score: Number(parsed.data.score),
        notes: parsed.data.notes || null
      }
    });
    revalidatePath(`/hr/${evaluation.employeeId}/edit`);
  } catch (err) {
    console.error('updateEvaluation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  return { success: true };
}

export async function deleteEvaluation(id: string) {
  const allowed = await requirePermission('hr.edit');
  if (!allowed) return;
  const evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (!evaluation) return;
  await prisma.evaluation.delete({ where: { id } });
  revalidatePath(`/hr/${evaluation.employeeId}/edit`);
}
