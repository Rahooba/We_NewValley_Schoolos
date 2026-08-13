'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { createEmployee, updateEmployee, type CreateEmployeeState } from '../actions';

export type EditEmployeeValues = {
  id: string;
  employeeCode: string;
  fullName: string;
  position: string | null;
  department: string | null;
  employmentCategory: string;
  status: string;
  contractStart: string | null;
  salary: string | null;
  contractType: string | null;
};

const initialState: CreateEmployeeState = {};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      {editing ? 'حفظ التعديلات' : 'حفظ الموظف'}
    </button>
  );
}

export function EmployeeForm({ employee }: { employee?: EditEmployeeValues }) {
  const editing = Boolean(employee);
  const [state, formAction] = useActionState(employee ? updateEmployee : createEmployee, initialState);

  return (
    <form action={formAction} className="card p-6 space-y-6 max-w-2xl">
      {employee && <input type="hidden" name="id" value={employee.id} />}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">كود الموظف *</label>
          <input
            name="employeeCode"
            required
            className="input-field"
            placeholder="EMP-0001"
            defaultValue={employee?.employeeCode ?? ''}
          />
          {state.fieldErrors?.employeeCode && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.employeeCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالكامل *</label>
          <input
            name="fullName"
            required
            className="input-field"
            placeholder="اسم الموظف"
            defaultValue={employee?.fullName ?? ''}
          />
          {state.fieldErrors?.fullName && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الوظيفة</label>
          <input
            name="position"
            className="input-field"
            placeholder="مثال: معلم فيزياء"
            defaultValue={employee?.position ?? ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">القسم</label>
          <input
            name="department"
            className="input-field"
            placeholder="مثال: قسم العلوم"
            defaultValue={employee?.department ?? ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">فئة التوظيف *</label>
          <select
            name="employmentCategory"
            required
            className="input-field"
            defaultValue={employee?.employmentCategory ?? 'contract'}
          >
            <option value="contract">تعاقد (Contract)</option>
            <option value="government">حكومي (Government)</option>
          </select>
        </div>

        {editing && (
          <div>
            <label className="block text-sm font-medium mb-1">الحالة</label>
            <select name="status" className="input-field" defaultValue={employee?.status ?? 'ACTIVE'}>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-medium mb-3">بيانات العقد</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ التعيين</label>
            <input
              type="date"
              name="startDate"
              className="input-field"
              defaultValue={employee?.contractStart?.slice(0, 10) ?? ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المرتب</label>
            <input
              type="number"
              step="0.01"
              name="salary"
              className="input-field"
              placeholder="8000"
              defaultValue={employee?.salary ?? ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نوع العقد</label>
            <input
              name="contractType"
              className="input-field"
              placeholder="دوام كامل"
              defaultValue={employee?.contractType ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton editing={editing} />
      </div>
    </form>
  );
}
