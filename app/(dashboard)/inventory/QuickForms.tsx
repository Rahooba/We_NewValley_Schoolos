'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { createAsset, createSupplier, createPurchaseRequest, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

export function AssetForm() {
  const [state, action] = useActionState(createAsset, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اسم الصنف</label>
        <input name="name" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفئة</label>
        <input name="category" className="input-field text-sm" placeholder="أجهزة كمبيوتر" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الرقم التسلسلي</label>
        <input name="serialNumber" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الموقع</label>
        <input name="location" className="input-field text-sm" placeholder="معمل الشبكات" />
      </div>
      <MiniSubmit label="إضافة صنف" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function SupplierForm() {
  const [state, action] = useActionState(createSupplier, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اسم المورد</label>
        <input name="name" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الهاتف</label>
        <input name="phone" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">البريد الإلكتروني</label>
        <input name="email" className="input-field text-sm" />
      </div>
      <MiniSubmit label="إضافة مورد" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function PurchaseRequestForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createPurchaseRequest, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">الصنف المطلوب</label>
        <input name="item" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الكمية</label>
        <input type="number" min={1} name="quantity" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المورد</label>
        <select name="supplierId" className="input-field text-sm">
          <option value="">— بدون —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <MiniSubmit label="إضافة طلب شراء" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
