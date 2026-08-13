'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Download, Eye, Loader2, Pencil, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { deleteFile, replaceFile, renameFile, type ActionState } from './actions';

export type BlobFile = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  ref: string | null;
};

const initial: ActionState = {};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function basename(pathname: string): string {
  return pathname.split('/').pop() ?? pathname;
}

function SubmitMini({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1 inline-flex items-center gap-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : children}
    </button>
  );
}

function FileRow({ file }: { file: BlobFile }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteState, deleteAction] = useActionState(deleteFile, initial);
  const [replaceState, replaceAction] = useActionState(replaceFile, initial);
  const [renameState, renameAction] = useActionState(renameFile, initial);

  const streamHref = `/api/files/stream?pathname=${encodeURIComponent(file.pathname)}`;
  const downloadHref = `${streamHref}&download=1`;

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" dir="ltr" title={file.pathname}>
            {basename(file.pathname)}
          </p>
          <p className="text-xs text-muted truncate" dir="ltr">
            {file.pathname}
          </p>
          {file.ref && <p className="text-xs text-brand mt-0.5">{file.ref}</p>}
        </div>
        <div className="text-xs text-muted text-left shrink-0">
          <div>{formatSize(file.size)}</div>
          <div>{new Date(file.uploadedAt).toLocaleDateString('ar-EG')}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={streamHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-2 py-1"
            title="عرض الملف"
          >
            <Eye size={12} />
          </a>
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-2 py-1"
            title="تنزيل الملف"
          >
            <Download size={12} />
          </a>
          <button
            onClick={() => setEditOpen((v) => !v)}
            className="btn-secondary text-xs px-2 py-1"
            title={editOpen ? 'إغلاق التعديل' : 'تعديل الملف'}
          >
            {editOpen ? <X size={12} /> : <Pencil size={12} />}
          </button>
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm('هل أنت متأكد من حذف هذا الملف نهائيًا؟')) e.preventDefault();
            }}
          >
            <input type="hidden" name="url" value={file.url} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-sm border border-red-200 bg-white text-red-600 px-2 py-1 text-xs font-medium hover:bg-red-50 transition-colors"
              title="حذف الملف"
            >
              <Trash2 size={12} />
            </button>
          </form>
        </div>
      </div>
      {deleteState.error && <p className="text-xs text-red-600 mt-1">{deleteState.error}</p>}
      {deleteState.success && <p className="text-xs text-emerald-600 mt-1">تم حذف الملف</p>}

      {editOpen && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <form action={replaceAction} className="card p-3 space-y-2">
            <p className="text-xs font-medium">استبدال الملف</p>
            <p className="text-xs text-muted">يُستبدل المحتوى ويظل الاسم والروابط كما هي.</p>
            <input type="hidden" name="pathname" value={file.pathname} />
            <input type="file" name="file" required className="input-field text-xs py-1" />
            <SubmitMini>
              <RefreshCw size={12} /> استبدال
            </SubmitMini>
            {replaceState.error && <p className="text-xs text-red-600">{replaceState.error}</p>}
            {replaceState.success && <p className="text-xs text-emerald-600">تم استبدال الملف</p>}
          </form>
          <form action={renameAction} className="card p-3 space-y-2">
            <p className="text-xs font-medium">إعادة تسمية الملف</p>
            <p className="text-xs text-muted">يُحدَّث الاسم في كل الصفحات المرتبطة به تلقائيًا.</p>
            <input type="hidden" name="url" value={file.url} />
            <input type="hidden" name="pathname" value={file.pathname} />
            <input
              name="newName"
              required
              defaultValue={basename(file.pathname)}
              className="input-field text-xs py-1"
              dir="ltr"
            />
            <SubmitMini>
              <Pencil size={12} /> حفظ الاسم
            </SubmitMini>
            {renameState.error && <p className="text-xs text-red-600">{renameState.error}</p>}
            {renameState.success && <p className="text-xs text-emerald-600">تمت إعادة التسمية</p>}
          </form>
        </div>
      )}
    </div>
  );
}

export function FilesManager({ files }: { files: BlobFile[] }) {
  const [query, setQuery] = useState('');
  const sorted = [...files].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (f) => !q || f.pathname.toLowerCase().includes(q) || (f.ref ?? '').toLowerCase().includes(q)
  );
  const totalSize = sorted.reduce((s, f) => s + f.size, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border flex-wrap">
        <div className="text-sm text-muted">
          {sorted.length} ملف — الحجم الكلي {formatSize(totalSize)}
        </div>
        <div className="relative">
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن ملف..."
            className="input-field text-sm pr-8"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="p-6 text-center text-muted text-sm">لا توجد ملفات مرفوعة بعد</p>
      ) : (
        filtered.map((f) => <FileRow key={f.url} file={f} />)
      )}
    </div>
  );
}
