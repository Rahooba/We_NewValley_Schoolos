// 'use client';

// import { useState } from 'react';
// import { useActionState } from 'react';
// import { useFormStatus } from 'react-dom';
// import { Loader2, Plus, X, FileText, Image } from 'lucide-react';
// import { DeleteButton } from '@/components/DeleteButton';
// import {
//   createActivityRecord,
//   addProcedure,
//   addDocumentation,
//   deleteActivityRecord,
//   type ActionState
// } from './actions';

// const initial: ActionState = {};

// const CATEGORY_LABELS: Record<string, string> = {
//   camp: 'معسكر',
//   project: 'مشروع',
//   competition: 'مسابقة'
// };

// const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
//   camp: [
//     { value: 'al_qadah', label: 'القادة (Al-Qadah)' },
//     { value: 'al_intilaqa', label: 'الانطلاقة (Al-Intilaqa)' },
//     { value: 'al_tahyia', label: 'التهئية (Al-Tahyi\'a)' },
//     { value: 'al_ruwad', label: 'الرواد (Al-Ruwad)' }
//   ],
//   project: [
//     { value: 'yil', label: 'YIL (الصف الثاني)' },
//     { value: 'nexa', label: 'Nexa (الصف الثالث)' }
//   ],
//   competition: [
//     { value: 'general', label: 'عام' },
//     { value: 'academic', label: 'أكاديمية' },
//     { value: 'sports', label: 'رياضية' },
//     { value: 'cultural', label: 'ثقافية' }
//   ]
// };

// function SubmitButton() {
//   const { pending } = useFormStatus();
//   return (
//     <button type="submit" disabled={pending} className="btn-primary text-sm">
//       {pending && <Loader2 size={14} className="animate-spin" />}
//       إضافة
//     </button>
//   );
// }

// function RecordForm({ category, onClose }: { category: string; onClose: () => void }) {
//   const [state, action] = useActionState(createActivityRecord, initial);
//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-md p-5">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">{CATEGORY_LABELS[category]} جديد</h3>
//           <button type="button" onClick={onClose} className="text-muted hover:text-ink">
//             <X size={18} />
//           </button>
//         </div>
//         <form action={action} className="space-y-3">
//           <input type="hidden" name="category" value={category} />
//           <div>
//             <label className="block text-xs text-muted mb-1">النوع الفرعي *</label>
//             <select name="subtype" required className="input-field text-sm">
//               {SUBTYPE_OPTIONS[category]?.map((s) => (
//                 <option key={s.value} value={s.value}>{s.label}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">العنوان (اختياري)</label>
//             <input name="title" className="input-field text-sm" placeholder="اسم الدورة/الدفعة..." />
//           </div>
//           <div className="grid gap-3 sm:grid-cols-2">
//             <div>
//               <label className="block text-xs text-muted mb-1">تاريخ البداية</label>
//               <input type="date" name="startDate" className="input-field text-sm" />
//             </div>
//             <div>
//               <label className="block text-xs text-muted mb-1">تاريخ النهاية</label>
//               <input type="date" name="endDate" className="input-field text-sm" />
//             </div>
//           </div>
//           {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//           <SubmitButton />
//         </form>
//       </div>
//     </div>
//   );
// }

// function ProcedureForm({ activityId, onClose }: { activityId: string; onClose: () => void }) {
//   const [state, action] = useActionState(addProcedure, initial);
//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-md p-5">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">إضافة إجراء</h3>
//           <button type="button" onClick={onClose} className="text-muted hover:text-ink">
//             <X size={18} />
//           </button>
//         </div>
//         <form action={action} className="space-y-3">
//           <input type="hidden" name="activityId" value={activityId} />
//           <div>
//             <label className="block text-xs text-muted mb-1">ملاحظات *</label>
//             <textarea name="notes" rows={3} required className="input-field text-sm" />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">مرفق (PDF - اختياري)</label>
//             <input type="file" name="file" accept=".pdf" className="input-field text-sm" />
//           </div>
//           {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//           <SubmitButton />
//         </form>
//       </div>
//     </div>
//   );
// }

// function DocForm({ activityId, onClose }: { activityId: string; onClose: () => void }) {
//   const [state, action] = useActionState(addDocumentation, initial);
//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-md p-5">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">إضافة صورة توثيق</h3>
//           <button type="button" onClick={onClose} className="text-muted hover:text-ink">
//             <X size={18} />
//           </button>
//         </div>
//         <form action={action} className="space-y-3">
//           <input type="hidden" name="activityId" value={activityId} />
//           <div>
//             <label className="block text-xs text-muted mb-1">الصورة *</label>
//             <input type="file" name="file" accept="image/*" required className="input-field text-sm" />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">تعليق (اختياري)</label>
//             <input name="caption" className="input-field text-sm" />
//           </div>
//           {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//           <SubmitButton />
//         </form>
//       </div>
//     </div>
//   );
// }

// type ActivityRow = {
//   id: string;
//   category: string;
//   subtype: string;
//   title: string | null;
//   startDate: string | null;
//   endDate: string | null;
//   procedures: { id: string; notes: string | null; fileUrl: string | null; createdAt: string }[];
//   documentation: { id: string; photoUrl: string; caption: string | null; createdAt: string }[];
//   createdAt: string;
// };

// export function ActivityPanel({
//   category,
//   activities
// }: {
//   category: 'camp' | 'project' | 'competition';
//   activities: ActivityRow[];
// }) {
//   const [recordOpen, setRecordOpen] = useState(false);
//   const [procOpen, setProcOpen] = useState<string | null>(null);
//   const [docOpen, setDocOpen] = useState<string | null>(null);

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h2 className="text-lg font-medium">{CATEGORY_LABELS[category]} ({activities.length})</h2>
//         <button type="button" onClick={() => setRecordOpen(true)} className="btn-primary text-sm">
//           <Plus size={14} /> {CATEGORY_LABELS[category]} جديد
//         </button>
//       </div>

//       <div className="space-y-4">
//         {activities.length === 0 && (
//           <div className="card p-6 text-center text-muted">لا توجد سجلات بعد</div>
//         )}
//         {activities.map((a) => (
//           <div key={a.id} className="card p-4">
//             <div className="flex items-start justify-between gap-3 flex-wrap">
//               <div>
//                 <p className="font-medium">
//                   {a.title ?? `${CATEGORY_LABELS[a.category]} — ${a.subtype}`}
//                   <span className="text-xs text-muted ml-2">{a.subtype}</span>
//                 </p>
//                 {a.startDate && (
//                   <p className="text-xs text-muted">
//                     {new Date(a.startDate).toLocaleDateString('ar-EG')}
//                     {a.endDate && ` — ${new Date(a.endDate).toLocaleDateString('ar-EG')}`}
//                   </p>
//                 )}
//               </div>
//               <DeleteButton onDelete={deleteActivityRecord.bind(null, a.id)} />
//             </div>

//             <div className="mt-3 grid gap-4 md:grid-cols-2">
//               <section>
//                 <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
//                   <FileText size={14} /> إجراءات ({a.procedures.length})
//                 </h4>
//                 <button
//                   type="button"
//                   onClick={() => setProcOpen(a.id)}
//                   className="btn-primary text-xs"
//                 >
//                   <Plus size={12} /> إضافة إجراء
//                 </button>
//                 {a.procedures.length === 0 && <p className="text-xs text-muted">لا توجد إجراءات</p>}
//                 {a.procedures.map((p) => (
//                   <div key={p.id} className="border-t border-border pt-2 text-sm">
//                     <p>{p.notes}</p>
//                     {p.fileUrl && (
//                       <a href={p.fileUrl} target="_blank" className="text-xs text-brand hover:underline">
//                         عرض المرفق
//                       </a>
//                     )}
//                     <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</p>
//                   </div>
//                 ))}
//               </section>

//               <section>
//                 <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
//                   <Image size={14} /> توثيق ({a.documentation.length})
//                 </h4>
//                 <button
//                   type="button"
//                   onClick={() => setDocOpen(a.id)}
//                   className="btn-primary text-xs"
//                 >
//                   <Plus size={12} /> إضافة صورة
//                 </button>
//                 {a.documentation.length === 0 && <p className="text-xs text-muted">لا توجد صور</p>}
//                 <div className="grid gap-2 sm:grid-cols-2 mt-2">
//                   {a.documentation.map((d) => (
//                     <div key={d.id} className="relative group">
//                       <img src={d.photoUrl} alt={d.caption ?? ''} className="w-full h-32 object-cover rounded-sm border border-border" />
//                       {d.caption && (
//                         <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
//                           {d.caption}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </section>
//             </div>
//           </div>
//         ))}
//       </div>

//       {recordOpen && <RecordForm category={category} onClose={() => setRecordOpen(false)} />}
//       {procOpen && <ProcedureForm activityId={procOpen} onClose={() => setProcOpen(null)} />}
//       {docOpen && <DocForm activityId={docOpen} onClose={() => setDocOpen(null)} />}
//     </div>
//   );
// }
// --------------------------------------------------------------------------------------------------------
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, X, FileText, Image } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import {
  createActivityRecord,
  addProcedure,
  addDocumentation,
  deleteActivityRecord,
  type ActionState
} from './actions';

const initial: ActionState = {};

// Files are uploaded as private blobs, so the raw blob.url is not directly
// browsable (it returns "Forbidden" without a signed request). Route views
// through /api/files/stream instead, which streams the file server-side
// after checking the viewer's permission.
function blobViewUrl(rawUrl: string, download = false): string {
  let pathname = rawUrl;
  try {
    pathname = new URL(rawUrl).pathname.replace(/^\/+/, '');
  } catch {
    // rawUrl wasn't a full URL (already a pathname) — use as-is.
  }
  const params = new URLSearchParams({ pathname });
  if (download) params.set('download', '1');
  return `/api/files/stream?${params.toString()}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  camp: 'معسكر',
  project: 'مشروع',
  competition: 'مسابقة'
};

const SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  camp: [
    { value: 'al_qadah', label: 'القادة (Al-Qadah)' },
    { value: 'al_intilaqa', label: 'الانطلاقة (Al-Intilaqa)' },
    { value: 'al_tahyia', label: 'التهئية (Al-Tahyi\'a)' },
    { value: 'al_ruwad', label: 'الرواد (Al-Ruwad)' }
  ],
  project: [
    { value: 'yil', label: 'YIL (الصف الثاني)' },
    { value: 'nexa', label: 'Nexa (الصف الثالث)' }
  ],
  competition: [
    { value: 'general', label: 'عام' },
    { value: 'academic', label: 'أكاديمية' },
    { value: 'sports', label: 'رياضية' },
    { value: 'cultural', label: 'ثقافية' }
  ]
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      إضافة
    </button>
  );
}

function RecordForm({ category, onClose }: { category: string; onClose: () => void }) {
  const [state, action] = useActionState(createActivityRecord, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">{CATEGORY_LABELS[category]} جديد</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <input type="hidden" name="category" value={category} />
          <div>
            <label className="block text-xs text-muted mb-1">النوع الفرعي *</label>
            <select name="subtype" required className="input-field text-sm">
              {SUBTYPE_OPTIONS[category]?.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">العنوان (اختياري)</label>
            <input name="title" className="input-field text-sm" placeholder="اسم الدورة/الدفعة..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted mb-1">تاريخ البداية</label>
              <input type="date" name="startDate" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">تاريخ النهاية</label>
              <input type="date" name="endDate" className="input-field text-sm" />
            </div>
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

function ProcedureForm({ activityId, onClose }: { activityId: string; onClose: () => void }) {
  const [state, action] = useActionState(addProcedure, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">إضافة إجراء</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <input type="hidden" name="activityId" value={activityId} />
          <div>
            <label className="block text-xs text-muted mb-1">ملاحظات *</label>
            <textarea name="notes" rows={3} required className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">مرفق (PDF - اختياري)</label>
            <input type="file" name="file" accept=".pdf" className="input-field text-sm" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

function DocForm({ activityId, onClose }: { activityId: string; onClose: () => void }) {
  const [state, action] = useActionState(addDocumentation, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">إضافة صورة توثيق</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <input type="hidden" name="activityId" value={activityId} />
          <div>
            <label className="block text-xs text-muted mb-1">الصورة *</label>
            <input type="file" name="file" accept="image/*" required className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">تعليق (اختياري)</label>
            <input name="caption" className="input-field text-sm" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

type ActivityRow = {
  id: string;
  category: string;
  subtype: string;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  procedures: { id: string; notes: string | null; fileUrl: string | null; createdAt: string }[];
  documentation: { id: string; photoUrl: string; caption: string | null; createdAt: string }[];
  createdAt: string;
};

export function ActivityPanel({
  category,
  activities
}: {
  category: 'camp' | 'project' | 'competition';
  activities: ActivityRow[];
}) {
  const [recordOpen, setRecordOpen] = useState(false);
  const [procOpen, setProcOpen] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{CATEGORY_LABELS[category]} ({activities.length})</h2>
        <button type="button" onClick={() => setRecordOpen(true)} className="btn-primary text-sm">
          <Plus size={14} /> {CATEGORY_LABELS[category]} جديد
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 && (
          <div className="card p-6 text-center text-muted">لا توجد سجلات بعد</div>
        )}
        {activities.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium">
                  {a.title ?? `${CATEGORY_LABELS[a.category]} — ${a.subtype}`}
                  <span className="text-xs text-muted ml-2">{a.subtype}</span>
                </p>
                {a.startDate && (
                  <p className="text-xs text-muted">
                    {new Date(a.startDate).toLocaleDateString('ar-EG')}
                    {a.endDate && ` — ${new Date(a.endDate).toLocaleDateString('ar-EG')}`}
                  </p>
                )}
              </div>
              <DeleteButton onDelete={deleteActivityRecord.bind(null, a.id)} />
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <section>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <FileText size={14} /> إجراءات ({a.procedures.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setProcOpen(a.id)}
                  className="btn-primary text-xs"
                >
                  <Plus size={12} /> إضافة إجراء
                </button>
                {a.procedures.length === 0 && <p className="text-xs text-muted">لا توجد إجراءات</p>}
                {a.procedures.map((p) => (
                  <div key={p.id} className="border-t border-border pt-2 text-sm">
                    <p>{p.notes}</p>
                    {p.fileUrl && (
                      <a href={blobViewUrl(p.fileUrl)} target="_blank" className="text-xs text-brand hover:underline">
                        عرض المرفق
                      </a>
                    )}
                    <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                ))}
              </section>

              <section>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Image size={14} /> توثيق ({a.documentation.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setDocOpen(a.id)}
                  className="btn-primary text-xs"
                >
                  <Plus size={12} /> إضافة صورة
                </button>
                {a.documentation.length === 0 && <p className="text-xs text-muted">لا توجد صور</p>}
                <div className="grid gap-2 sm:grid-cols-2 mt-2">
                  {a.documentation.map((d) => (
                    <div key={d.id} className="relative group">
                      <img src={blobViewUrl(d.photoUrl)} alt={d.caption ?? ''} className="w-full h-32 object-cover rounded-sm border border-border" />
                      {d.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                          {d.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ))}
      </div>

      {recordOpen && <RecordForm category={category} onClose={() => setRecordOpen(false)} />}
      {procOpen && <ProcedureForm activityId={procOpen} onClose={() => setProcOpen(null)} />}
      {docOpen && <DocForm activityId={docOpen} onClose={() => setDocOpen(null)} />}
    </div>
  );
}