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

export type ActionState = { error?: string; success?: boolean };

export async function createAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    name: z.string().min(2, 'اسم الصنف مطلوب'),
    category: z.string().optional().or(z.literal('')),
    serialNumber: z.string().optional().or(z.literal('')),
    location: z.string().optional().or(z.literal('')),
    condition: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    serialNumber: String(formData.get('serialNumber') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    condition: String(formData.get('condition') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.asset.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        serialNumber: parsed.data.serialNumber || null,
        location: parsed.data.location || null,
        condition: parsed.data.condition || null
      }
    });
  } catch (err) {
    console.error('createAsset failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، ربما الرقم التسلسلي مستخدم من قبل' };
  }
  revalidatePath('/inventory');
  return {};
}

export async function createSupplier(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    name: z.string().min(2, 'اسم المورد مطلوب'),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.supplier.create({
      data: { name: parsed.data.name, phone: parsed.data.phone || null, email: parsed.data.email || null }
    });
  } catch (err) {
    console.error('createSupplier failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return {};
}

export async function createPurchaseRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    supplierId: z.string().optional().or(z.literal('')),
    item: z.string().min(2, 'اسم الصنف مطلوب'),
    quantity: z.string().min(1, 'الكمية مطلوبة')
  });
  const parsed = schema.safeParse({
    supplierId: String(formData.get('supplierId') ?? ''),
    item: String(formData.get('item') ?? '').trim(),
    quantity: String(formData.get('quantity') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.purchaseRequest.create({
      data: {
        supplierId: parsed.data.supplierId || null,
        item: parsed.data.item,
        quantity: Number(parsed.data.quantity),
        status: 'PENDING'
      }
    });
  } catch (err) {
    console.error('createPurchaseRequest failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return {};
}

// ---------------- Asset edit/delete ----------------

const assetSchema = z.object({
  name: z.string().min(2, 'اسم الصنف مطلوب'),
  category: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  condition: z.string().optional().or(z.literal(''))
});

export async function updateAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = assetSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    serialNumber: String(formData.get('serialNumber') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    condition: String(formData.get('condition') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.asset.update({
      where: { id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        serialNumber: parsed.data.serialNumber || null,
        location: parsed.data.location || null,
        condition: parsed.data.condition || null
      }
    });
  } catch (err) {
    console.error('updateAsset failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، ربما الرقم التسلسلي مستخدم من قبل' };
  }
  revalidatePath('/inventory');
  return { success: true };
}

export async function deleteAsset(id: string) {
  if (!(await requirePermission('inventory.manage'))) return;
  await prisma.asset.delete({ where: { id } });
  revalidatePath('/inventory');
}

// ---------------- Supplier edit/delete ----------------

const supplierSchema = z.object({
  name: z.string().min(2, 'اسم المورد مطلوب'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal(''))
});

export async function updateSupplier(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = supplierSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null
      }
    });
  } catch (err) {
    console.error('updateSupplier failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return { success: true };
}

export async function deleteSupplier(id: string) {
  if (!(await requirePermission('inventory.manage'))) return;
  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/inventory');
}

// ---------------- Purchase request edit/delete ----------------

const requestSchema = z.object({
  supplierId: z.string().optional().or(z.literal('')),
  item: z.string().min(2, 'اسم الصنف مطلوب'),
  quantity: z.string().min(1, 'الكمية مطلوبة'),
  status: z.string().optional().or(z.literal(''))
});

export async function updatePurchaseRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = requestSchema.safeParse({
    supplierId: String(formData.get('supplierId') ?? ''),
    item: String(formData.get('item') ?? '').trim(),
    quantity: String(formData.get('quantity') ?? ''),
    status: String(formData.get('status') ?? 'PENDING')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.purchaseRequest.update({
      where: { id },
      data: {
        supplierId: parsed.data.supplierId || null,
        item: parsed.data.item,
        quantity: Number(parsed.data.quantity),
        status: (parsed.data.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING'
      }
    });
  } catch (err) {
    console.error('updatePurchaseRequest failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return { success: true };
}

export async function deletePurchaseRequest(id: string) {
  if (!(await requirePermission('inventory.manage'))) return;
  await prisma.purchaseRequest.delete({ where: { id } });
  revalidatePath('/inventory');
}

// ---------------- Maintenance CRUD ----------------

const maintenanceSchema = z.object({
  assetId: z.string().min(1, 'اختر الصنف'),
  issue: z.string().min(2, 'وصف العطل مطلوب'),
  status: z.string().optional().or(z.literal('')),
  scheduledAt: z.string().optional().or(z.literal(''))
});

export async function addMaintenance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = maintenanceSchema.safeParse({
    assetId: String(formData.get('assetId') ?? ''),
    issue: String(formData.get('issue') ?? '').trim(),
    status: String(formData.get('status') ?? 'open'),
    scheduledAt: String(formData.get('scheduledAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.maintenance.create({
      data: {
        assetId: parsed.data.assetId,
        issue: parsed.data.issue,
        status: parsed.data.status || 'open',
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null
      }
    });
  } catch (err) {
    console.error('addMaintenance failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return { success: true };
}

export async function updateMaintenance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('inventory.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = maintenanceSchema.safeParse({
    assetId: String(formData.get('assetId') ?? ''),
    issue: String(formData.get('issue') ?? '').trim(),
    status: String(formData.get('status') ?? 'open'),
    scheduledAt: String(formData.get('scheduledAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.maintenance.update({
      where: { id },
      data: {
        assetId: parsed.data.assetId,
        issue: parsed.data.issue,
        status: parsed.data.status || 'open',
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null
      }
    });
  } catch (err) {
    console.error('updateMaintenance failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/inventory');
  return { success: true };
}

export async function deleteMaintenance(id: string) {
  if (!(await requirePermission('inventory.manage'))) return;
  await prisma.maintenance.delete({ where: { id } });
  revalidatePath('/inventory');
}
