// 'use client';

// import { useFormStatus } from 'react-dom';
// import { useActionState } from 'react';
// import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
// import { PermissionGate } from '@/components/PermissionGate';
// import {
//   deleteAttendanceDocument,
//   uploadAttendanceDocument,
//   type AttendanceDocType,
//   type DocActionState
// } from '@/app/(dashboard)/attendance/actions';

// export type AttendanceDocItem = {
//   id: string;
//   date: string;
//   fileUrl: string;
//   notes: string | null;
// };

// const initial: DocActionState = {};

// function SubmitButton() {
//   const { pending } = useFormStatus();
//   return (
//     <button type="submit" disabled={pending} className="btn-primary">
//       {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
//       رفع المستند
//     </button>
//   );
// }

// function todayInput(): string {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
//     d.getDate()
//   ).padStart(2, '0')}`;
// }

// export function AttendanceDocumentUpload({
//   type,
//   docs
// }: {
//   type: AttendanceDocType;
//   docs: AttendanceDocItem[];
// }) {
//   const [state, action] = useActionState(uploadAttendanceDocument.bind(null, type), initial);
//   const managePermission = type === 'students' ? 'attendance.students.manage' : 'attendance.employees.manage';

//   return (
//     <section className="card p-4 mb-6">
//       <h2 className="font-display mb-3">رفع مستند الغياب الورقي</h2>

//       <PermissionGate permission={managePermission}>
//         <form action={action} className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] items-end">
//           <div>
//             <label className="block text-xs text-muted mb-1" htmlFor={`doc-date-${type}`}>
//               التاريخ
//             </label>
//             <input
//               id={`doc-date-${type}`}
//               type="date"
//               name="date"
//               defaultValue={todayInput()}
//               className="input-field"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1" htmlFor={`doc-file-${type}`}>
//               الملف (PDF / JPG / PNG)
//             </label>
//             <input
//               id={`doc-file-${type}`}
//               type="file"
//               name="file"
//               accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
//               className="input-field"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1" htmlFor={`doc-notes-${type}`}>
//               ملاحظات (اختياري)
//             </label>
//             <input id={`doc-notes-${type}`} type="text" name="notes" className="input-field" />
//           </div>
//           <div className="flex items-center gap-2">
//             <SubmitButton />
//             {state.error && <p className="text-xs text-red-600 max-w-[220px]">{state.error}</p>}
//             {state.success && <p className="text-xs text-emerald-600">تم رفع المستند</p>}
//           </div>
//         </form>
//       </PermissionGate>

//       <div className="mt-4">
//         <h3 className="text-xs font-medium text-muted mb-2">مستندات الشهر الحالي</h3>
//         {docs.length === 0 ? (
//           <p className="text-sm text-muted">لا توجد مستندات مرفوعة هذا الشهر.</p>
//         ) : (
//           <ul className="divide-y divide-border">
//             {docs.map((doc) => (
//               <li key={doc.id} className="py-2 flex items-center gap-3 text-sm">
//                 <FileText size={16} className="text-brand shrink-0" />
//                 <span className="text-muted tabular-nums">
//                   {new Date(doc.date).toLocaleDateString('ar-EG', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric'
//                   })}
//                 </span>
//                 {doc.notes && <span className="text-muted line-clamp-1">{doc.notes}</span>}
//                 <span className="flex-1" />
//                 <a
//                   href={doc.fileUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-brand hover:underline text-xs"
//                 >
//                   عرض / تحميل
//                 </a>
//                 <PermissionGate permission={managePermission}>
//                   <form
//                     action={deleteAttendanceDocument.bind(null, type, doc.id)}
//                     className="inline"
//                   >
//                     <button
//                       type="submit"
//                       title="حذف المستند"
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <Trash2 size={15} />
//                     </button>
//                   </form>
//                 </PermissionGate>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </section>
//   );
// }
// ---------------------------------------------------------------------------------------
'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { blobViewUrl } from '@/lib/blob-view-url';
import {
  deleteAttendanceDocument,
  uploadAttendanceDocument,
  type AttendanceDocType,
  type DocActionState
} from '@/app/(dashboard)/attendance/actions';

export type AttendanceDocItem = {
  id: string;
  date: string;
  fileUrl: string;
  notes: string | null;
};

const initial: DocActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      رفع المستند
    </button>
  );
}

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function AttendanceDocumentUpload({
  type,
  docs
}: {
  type: AttendanceDocType;
  docs: AttendanceDocItem[];
}) {
  const [state, action] = useActionState(uploadAttendanceDocument.bind(null, type), initial);
  const managePermission = type === 'students' ? 'attendance.students.manage' : 'attendance.employees.manage';

  return (
    <section className="card p-4 mb-6">
      <h2 className="font-display mb-3">رفع مستند الغياب الورقي</h2>

      <PermissionGate permission={managePermission}>
        <form action={action} className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] items-end">
          <div>
            <label className="block text-xs text-muted mb-1" htmlFor={`doc-date-${type}`}>
              التاريخ
            </label>
            <input
              id={`doc-date-${type}`}
              type="date"
              name="date"
              defaultValue={todayInput()}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1" htmlFor={`doc-file-${type}`}>
              الملف (PDF / JPG / PNG)
            </label>
            <input
              id={`doc-file-${type}`}
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1" htmlFor={`doc-notes-${type}`}>
              ملاحظات (اختياري)
            </label>
            <input id={`doc-notes-${type}`} type="text" name="notes" className="input-field" />
          </div>
          <div className="flex items-center gap-2">
            <SubmitButton />
            {state.error && <p className="text-xs text-red-600 max-w-[220px]">{state.error}</p>}
            {state.success && <p className="text-xs text-emerald-600">تم رفع المستند</p>}
          </div>
        </form>
      </PermissionGate>

      <div className="mt-4">
        <h3 className="text-xs font-medium text-muted mb-2">مستندات الشهر الحالي</h3>
        {docs.length === 0 ? (
          <p className="text-sm text-muted">لا توجد مستندات مرفوعة هذا الشهر.</p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((doc) => (
              <li key={doc.id} className="py-2 flex items-center gap-3 text-sm">
                <FileText size={16} className="text-brand shrink-0" />
                <span className="text-muted tabular-nums">
                  {new Date(doc.date).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {doc.notes && <span className="text-muted line-clamp-1">{doc.notes}</span>}
                <span className="flex-1" />
                <a
                  href={blobViewUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline text-xs"
                >
                  عرض / تحميل
                </a>
                <PermissionGate permission={managePermission}>
                  <form
                    action={deleteAttendanceDocument.bind(null, type, doc.id)}
                    className="inline"
                  >
                    <button
                      type="submit"
                      title="حذف المستند"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
