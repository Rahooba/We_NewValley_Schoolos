'use client';

import { useActionState, Fragment, useEffect, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Loader2, Pencil, X } from 'lucide-react';
import { DeleteButton } from './DeleteButton';

export type ManageField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'hidden';
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  min?: number | string;
  placeholder?: string;
  full?: boolean;
  value?: string;
};

export type ManageColumn = {
  key: string;
  label: string;
  render?: (row: any) => ReactNode;
};

export type ManageActionState = { error?: string; success?: boolean };

type ManageRowsProps = {
  idField?: string;
  columns: ManageColumn[];
  rows: any[];
  fields?: ManageField[];
  getValue?: (row: any, field: ManageField) => string;
  updateAction?: (prev: any, fd: FormData) => Promise<ManageActionState>;
  deleteAction?: (id: string) => Promise<unknown> | void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyText?: string;
  linkLabel?: string;
};

function FieldInput({ field, value }: { field: ManageField; value: string }) {
  if (field.type === 'select') {
    return (
      <select name={field.name} required={field.required} defaultValue={value} className="input-field text-sm">
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        name={field.name}
        rows={2}
        required={field.required}
        defaultValue={value}
        placeholder={field.placeholder}
        className="input-field text-sm"
      />
    );
  }
  return (
    <input
      type={field.type ?? 'text'}
      name={field.name}
      required={field.required}
      step={field.step}
      min={field.min}
      defaultValue={value}
      placeholder={field.placeholder}
      className="input-field text-sm"
    />
  );
}

function RowEditor({
  row,
  idField,
  fields,
  getValue,
  updateAction,
  onClose
}: {
  row: any;
  idField: string;
  fields: ManageField[];
  getValue: (row: any, field: ManageField) => string;
  updateAction: (prev: any, fd: FormData) => Promise<ManageActionState>;
  onClose: () => void;
}) {
  const [state, action] = useActionState(updateAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <tr>
      <td colSpan={99} className="px-4 py-3 bg-surface/50 border-t border-border">
        <form action={action} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-end">
          <input type="hidden" name="id" value={row[idField]} />
          {fields.map((f) => (
            <div key={f.name} className={f.full ? 'sm:col-span-2 lg:col-span-3' : ''}>
              <label className="block text-xs text-muted mb-1">{f.label}</label>
              <FieldInput field={f} value={getValue(row, f)} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <SaveButton />
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-2 py-1.5 rounded-sm bg-paper border border-border hover:border-ink"
            >
              إلغاء
            </button>
          </div>
        </form>
        {state.error && <p className="text-xs text-red-600 mt-2">{state.error}</p>}
      </td>
    </tr>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
      حفظ التعديل
    </button>
  );
}

export function ManageRows({
  idField = 'id',
  columns,
  rows,
  fields,
  getValue,
  updateAction,
  deleteAction,
  canEdit = true,
  canDelete = true,
  emptyText = 'لا توجد بيانات',
  linkLabel
}: ManageRowsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasActions = Boolean(updateAction || deleteAction);
  const getValueFn = getValue ?? defaultgetValue;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-medium">
                {c.label}
              </th>
            ))}
            {hasActions && <th className="px-4 py-2 font-medium">إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const rowId = String(row[idField] ?? '');
            return (
              <Fragment key={rowId}>
                <tr className="border-t border-border">
                  {columns.map((c, ci) => (
                    <td key={c.key} className="px-4 py-2">
                      {c.render ? (
                        c.render(row)
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>{row[c.key] ?? '—'}</span>
                          {linkLabel && ci === 0 && row._href && (
                            <Link href={row._href} className="text-brand hover:underline text-xs">
                              {linkLabel}
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {updateAction && canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditingId(editingId === rowId ? null : rowId)}
                            className="inline-flex items-center gap-1 text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                          >
                            {editingId === rowId ? <X size={14} /> : <Pencil size={14} />}
                            {editingId === rowId ? 'إغلاق' : 'تعديل'}
                          </button>
                        )}
                        {deleteAction && canDelete && <DeleteButton onDelete={() => deleteAction(rowId)} />}
                      </div>
                    </td>
                  )}
                </tr>
                {updateAction && editingId === rowId && (
                  <RowEditor
                    row={row}
                    idField={idField}
                    fields={fields ?? []}
                    getValue={getValueFn}
                    updateAction={updateAction}
                    onClose={() => setEditingId(null)}
                  />
                )}
              </Fragment>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

function defaultgetValue(row: any, field: ManageField): string {
  const v = row[field.name];
  if (v === null || v === undefined) return '';
  return String(v);
}
