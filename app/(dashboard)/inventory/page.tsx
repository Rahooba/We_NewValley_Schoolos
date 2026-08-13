import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { AssetForm, SupplierForm, PurchaseRequestForm } from './QuickForms';
import { MaintenanceForm } from './MaintenanceForm';
import {
  updateAsset,
  deleteAsset,
  updateSupplier,
  deleteSupplier,
  updatePurchaseRequest,
  deletePurchaseRequest,
  updateMaintenance,
  deleteMaintenance
} from './actions';

const statusAr: Record<string, string> = { PENDING: 'قيد الانتظار', APPROVED: 'موافَق عليه', REJECTED: 'مرفوض' };
const statusOptions = [
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'APPROVED', label: 'موافَق عليه' },
  { value: 'REJECTED', label: 'مرفوض' }
];
const maintenanceStatusOptions = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' }
];

export default async function InventoryPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('inventory.manage');

  const [assets, suppliers, requests, maintenance] = await Promise.all([
    prisma.asset.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.purchaseRequest.findMany({ include: { supplier: true }, orderBy: { requestedAt: 'desc' } }),
    prisma.maintenance.findMany({ include: { asset: true }, orderBy: { id: 'desc' }, take: 10 })
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display">المخازن</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">الأصناف / الأصول</h2>
        <AssetForm />
        <ManageRows
          columns={[
            { key: 'name', label: 'الاسم' },
            { key: 'category', label: 'الفئة' },
            { key: 'serialNumber', label: 'الرقم التسلسلي' },
            { key: 'location', label: 'الموقع' }
          ]}
          rows={assets.map((a) => ({
            id: a.id,
            name: a.name,
            category: a.category ?? '',
            serialNumber: a.serialNumber ?? '',
            location: a.location ?? '',
            condition: a.condition ?? ''
          }))}
          fields={
            [
              { name: 'name', label: 'الاسم', type: 'text', required: true },
              { name: 'category', label: 'الفئة', type: 'text' },
              { name: 'serialNumber', label: 'الرقم التسلسلي', type: 'text' },
              { name: 'location', label: 'الموقع', type: 'text' },
              { name: 'condition', label: 'الحالة الفنية', type: 'text' }
            ] satisfies ManageField[]
          }
          updateAction={updateAsset}
          deleteAction={deleteAsset}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد أصناف بعد"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">الموردون</h2>
        <SupplierForm />
        <ManageRows
          columns={[
            { key: 'name', label: 'الاسم' },
            { key: 'phone', label: 'الهاتف' },
            { key: 'email', label: 'البريد الإلكتروني' }
          ]}
          rows={suppliers.map((s) => ({
            id: s.id,
            name: s.name,
            phone: s.phone ?? '',
            email: s.email ?? ''
          }))}
          fields={
            [
              { name: 'name', label: 'الاسم', type: 'text', required: true },
              { name: 'phone', label: 'الهاتف', type: 'text' },
              { name: 'email', label: 'البريد الإلكتروني', type: 'text' }
            ] satisfies ManageField[]
          }
          updateAction={updateSupplier}
          deleteAction={deleteSupplier}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا يوجد موردون بعد"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">طلبات الشراء</h2>
        <PurchaseRequestForm suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))} />
        <ManageRows
          columns={[
            { key: 'item', label: 'الصنف' },
            { key: 'quantity', label: 'الكمية' },
            { key: 'supplierDisplay', label: 'المورد' },
            { key: 'statusDisplay', label: 'الحالة' }
          ]}
          rows={requests.map((r) => ({
            id: r.id,
            item: r.item,
            quantity: r.quantity,
            supplierName: r.supplier?.name ?? '',
            supplierId: r.supplierId ?? '',
            supplierDisplay: r.supplier?.name ?? '—',
            status: r.status,
            statusDisplay: statusAr[r.status] ?? r.status
          }))}
          fields={
            [
              { name: 'item', label: 'الصنف', type: 'text', required: true },
              { name: 'quantity', label: 'الكمية', type: 'number', required: true, min: 1 },
              {
                name: 'supplierId',
                label: 'المورد',
                type: 'select',
                options: [{ value: '', label: 'بدون مورد' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]
              },
              { name: 'status', label: 'الحالة', type: 'select', options: statusOptions }
            ] satisfies ManageField[]
          }
          updateAction={updatePurchaseRequest}
          deleteAction={deletePurchaseRequest}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد طلبات شراء بعد"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">الصيانة</h2>
        {canManage && <MaintenanceForm assets={assets.map((a) => ({ id: a.id, name: a.name }))} />}
        <ManageRows
          columns={[
            { key: 'assetDisplay', label: 'الصنف' },
            { key: 'issue', label: 'العطل' },
            { key: 'status', label: 'الحالة' },
            { key: 'scheduledAtDisplay', label: 'تاريخ الصيانة' }
          ]}
          rows={maintenance.map((m) => ({
            id: m.id,
            assetName: m.asset.name,
            assetId: m.assetId,
            assetDisplay: m.asset.name,
            issue: m.issue,
            status: m.status,
            scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : '',
            scheduledAtDisplay: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('ar-EG') : '—'
          }))}
          fields={
            [
              {
                name: 'assetId',
                label: 'الصنف',
                type: 'select',
                required: true,
                options: assets.map((a) => ({ value: a.id, label: a.name }))
              },
              { name: 'issue', label: 'وصف العطل', type: 'text', required: true },
              { name: 'status', label: 'الحالة', type: 'select', options: maintenanceStatusOptions },
              { name: 'scheduledAt', label: 'تاريخ الصيانة', type: 'date' }
            ] satisfies ManageField[]
          }
          updateAction={updateMaintenance}
          deleteAction={deleteMaintenance}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد طلبات صيانة بعد"
        />
      </section>
    </div>
  );
}
