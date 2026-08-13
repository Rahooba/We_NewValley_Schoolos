// 'use client';

// import { useState } from 'react';
// import { useActionState } from 'react';
// import { useFormStatus } from 'react-dom';
// import { Loader2, Plus, X } from 'lucide-react';
// import { StudentPicker } from '@/components/StudentPicker';
// import { DeleteButton } from '@/components/DeleteButton';
// import { submitSpecialistReport, formProtectionCommittee, decideProtectionCommittee, type ActionState } from './actions';

// const initial: ActionState = {};

// function ReportForm({ students, onClose }: { students: StudentOption[]; onClose: () => void }) {
//   const [state, action] = useActionState(submitSpecialistReport, initial);
//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-lg p-5">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">مذكرة إلى الأخصائي</h3>
//           <button type="button" onClick={onClose} className="text-muted hover:text-ink">
//             <X size={18} />
//           </button>
//         </div>
//         <form action={action} className="space-y-3">
//           <div>
//             <label className="block text-xs text-muted mb-1">الطالب *</label>
//             <StudentPicker students={students} name="studentId" />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">محتوى المذكرة *</label>
//             <textarea name="content" rows={3} required className="input-field text-sm" placeholder="ملاحظات على حالة الطالب..." />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">مرفق (اختياري — PDF / صورة)</label>
//             <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" className="input-field text-sm" />
//           </div>
//           {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//           <button type="submit" className="btn-primary w-full text-sm">
//             إرسال المذكرة
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// function CommitteeForm({
//   students,
//   employees,
//   onClose
// }: {
//   students: StudentOption[];
//   employees: { id: string; fullName: string }[];
//   onClose: () => void;
// }) {
//   const [state, action] = useActionState(formProtectionCommittee, initial);
//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-lg p-5">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">تشكيل لجنة حماية</h3>
//           <button type="button" onClick={onClose} className="text-muted hover:text-ink">
//             <X size={18} />
//           </button>
//         </div>
//         <form action={action} className="space-y-3">
//           <div>
//             <label className="block text-xs text-muted mb-1">الطالب *</label>
//             <StudentPicker students={students} name="studentId" />
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">أعضاء اللجنة</label>
//             <div className="max-h-40 overflow-auto border border-border rounded-sm p-2 space-y-1">
//               {employees.map((e) => (
//                 <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
//                   <input type="checkbox" name="member" value={e.id} className="accent-[var(--brand)]" />
//                   {e.fullName}
//                 </label>
//               ))}
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs text-muted mb-1">الرأي النهائي (اختياري)</label>
//             <textarea name="finalOpinion" rows={2} className="input-field text-sm" />
//           </div>
//           {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//           <button type="submit" className="btn-primary w-full text-sm">
//             تشكيل اللجنة
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// function DecideForm({ committeeId, onDone }: { committeeId: string; onDone: () => void }) {
//   const [state, action] = useActionState(decideProtectionCommittee.bind(null, committeeId), initial);
//   const { pending } = useFormStatus();
//   return (
//     <form action={action} className="space-y-2 bg-paper border border-border rounded-sm p-3">
//       <div className="flex items-center gap-3">
//         <select name="status" className="input-field text-sm flex-1">
//           <option value="open">مفتوحة</option>
//           <option value="decided">تم البت</option>
//         </select>
//         <button type="submit" disabled={pending} className="btn-primary text-xs">
//           {pending ? <Loader2 size={12} className="animate-spin" /> : 'حفظ'}
//         </button>
//         <button type="button" onClick={onDone} className="text-xs text-muted hover:text-ink">
//           إغلاق
//         </button>
//       </div>
//       <textarea
//         name="finalOpinion"
//         rows={2}
//         placeholder="الرأي النهائي للجنة..."
//         className="input-field text-sm"
//       />
//       {state.error && <p className="text-xs text-red-600">{state.error}</p>}
//     </form>
//   );
// }

// type StudentOption = { id: string; fullName: string; studentCode?: string; className?: string };

// export function ProtectionPanel({
//   canSubmit,
//   canManage,
//   studentOptions,
//   employees,
//   reports,
//   onDeleteReport,
//   committees,
//   onDeleteCommittee
// }: {
//   canSubmit: boolean;
//   canManage: boolean;
//   studentOptions: StudentOption[];
//   employees: { id: string; fullName: string }[];
//   reports: {
//     id: string;
//     studentName: string;
//     studentCode: string;
//     className: string;
//     content: string;
//     fileUrl: string | null;
//     createdAt: string;
//     teacherName: string;
//   }[];
//   onDeleteReport: (id: string) => void;
//   committees: {
//     id: string;
//     studentName: string;
//     studentCode: string;
//     className: string;
//     memberNames: string[];
//     status: string;
//     finalOpinion: string | null;
//     createdAt: string;
//   }[];
//   onDeleteCommittee: (id: string) => void;
// }) {
//   const [reportOpen, setReportOpen] = useState(false);
//   const [committeeOpen, setCommitteeOpen] = useState(false);
//   const [deciding, setDeciding] = useState<string | null>(null);

//   return (
//     <div className="space-y-8">
//       <section>
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-medium">مذكرات المعلمين ({reports.length})</h2>
//           {canSubmit && (
//             <button type="button" onClick={() => setReportOpen(true)} className="btn-primary text-sm">
//               <Plus size={14} /> إرسال مذكرة
//             </button>
//           )}
//         </div>
//         <div className="card overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="bg-paper text-muted text-right">
//               <tr>
//                 <th className="px-4 py-2 font-medium">التاريخ</th>
//                 <th className="px-4 py-2 font-medium">معلم</th>
//                 <th className="px-4 py-2 font-medium">الطالب</th>
//                 <th className="px-4 py-2 font-medium">المحتوى</th>
//                 <th className="px-4 py-2 font-medium">المرفق</th>
//                 {canSubmit && <th className="px-4 py-2 font-medium"></th>}
//               </tr>
//             </thead>
//             <tbody>
//               {reports.length === 0 && (
//                 <tr>
//                   <td colSpan={canSubmit ? 6 : 5} className="px-4 py-6 text-center text-muted">
//                     لا توجد مذكرات بعد
//                   </td>
//                 </tr>
//               )}
//               {reports.map((r) => (
//                 <tr key={r.id} className="border-t border-border align-top">
//                   <td className="px-4 py-2 text-muted whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</td>
//                   <td className="px-4 py-2">{r.teacherName}</td>
//                   <td className="px-4 py-2">
//                     {r.studentName}
//                     <span className="text-xs text-muted block">{r.studentCode} — {r.className}</span>
//                   </td>
//                   <td className="px-4 py-2">{r.content}</td>
//                   <td className="px-4 py-2">
//                     {r.fileUrl && (
//                       <a href={r.fileUrl} target="_blank" className="text-xs text-brand hover:underline">
//                         عرض المرفق
//                       </a>
//                     )}
//                   </td>
//                   {canSubmit && (
//                     <td className="px-4 py-2">
//                       <DeleteButton onDelete={() => onDeleteReport(r.id)} />
//                     </td>
//                   )}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </section>

//       <section>
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-medium">لجان الحماية ({committees.length})</h2>
//           {canManage && (
//             <button type="button" onClick={() => setCommitteeOpen(true)} className="btn-primary text-sm">
//               <Plus size={14} /> تشكيل لجنة
//             </button>
//           )}
//         </div>
//         <div className="space-y-3">
//           {committees.length === 0 && (
//             <div className="card p-6 text-center text-muted text-sm">لا توجد لجان بعد</div>
//           )}
//           {committees.map((c) => (
//             <div key={c.id} className="card p-4">
//               <div className="flex items-start justify-between gap-3 flex-wrap">
//                 <div>
//                   <p className="font-medium">
//                     {c.studentName}
//                     <span className="text-xs text-muted block">
//                       {c.studentCode} — {c.className}
//                     </span>
//                   </p>
//                   <p className="text-xs text-muted mt-1">
//                     الأعضاء: {c.memberNames.length ? c.memberNames.join('، ') : 'لم يُحدد أعضاء بعد'}
//                   </p>
//                   <p className="text-xs text-muted mt-1">تاريخ التشكيل: {new Date(c.createdAt).toLocaleDateString('ar-EG')}</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {c.status === 'open' ? (
//                     <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">مفتوحة</span>
//                   ) : (
//                     <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">تم البت</span>
//                   )}
//                   {canManage && (
//                     <>
//                       <DeleteButton onDelete={() => onDeleteCommittee(c.id)} />
//                       <button
//                         type="button"
//                         onClick={() => setDeciding(deciding === c.id ? null : c.id)}
//                         className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
//                       >
//                         البت في اللجنة
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//               {c.finalOpinion && (
//                 <p className="mt-3 text-sm bg-paper rounded-sm border border-border p-3">
//                   <span className="font-medium">الرأي النهائي: </span>
//                   {c.finalOpinion}
//                 </p>
//               )}
//               {deciding === c.id && canManage && <div className="mt-3"><DecideForm committeeId={c.id} onDone={() => setDeciding(null)} /></div>}
//             </div>
//           ))}
//         </div>
//       </section>

//       {reportOpen && <ReportForm students={studentOptions} onClose={() => setReportOpen(false)} />}
//       {committeeOpen && <CommitteeForm students={studentOptions} employees={employees} onClose={() => setCommitteeOpen(false)} />}
//     </div>
//   );
// // }
// 'use client';

// import { useState } from 'react';
// import { useActionState } from 'react';
// import { useFormStatus } from 'react-dom';
// import { Loader2, Plus, X } from 'lucide-react';
// import { StudentPicker } from '@/components/StudentPicker';
// import {
//   submitSpecialistReport,
//   formProtectionCommittee,
//   decideProtectionCommittee,
//   deleteSpecialistReport,
//   deleteProtectionCommittee,
//   type ActionState,
// } from './actions';

// const initial: ActionState = {};

// type StudentOption = {
//   id: string;
//   fullName: string;
//   studentCode?: string;
//   className?: string;
// };

// /* =========================================================
//    Report Submit Button
// ========================================================= */

// function ReportSubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className="btn-primary w-full text-sm flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 size={14} className="animate-spin" />
//           جاري الإرسال...
//         </>
//       ) : (
//         'إرسال المذكرة'
//       )}
//     </button>
//   );
// }

// /* =========================================================
//    Committee Submit Button
// ========================================================= */

// function CommitteeSubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className="btn-primary w-full text-sm flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 size={14} className="animate-spin" />
//           جاري التشكيل...
//         </>
//       ) : (
//         'تشكيل اللجنة'
//       )}
//     </button>
//   );
// }

// /* =========================================================
//    Decide Submit Button
// ========================================================= */

// function DecideSubmitButton() {
//   const { pending } = useFormStatus();

//   return (
//     <button
//       type="submit"
//       disabled={pending}
//       className="btn-primary text-xs flex items-center gap-1"
//     >
//       {pending ? (
//         <>
//           <Loader2 size={12} className="animate-spin" />
//           جاري الحفظ...
//         </>
//       ) : (
//         'حفظ'
//       )}
//     </button>
//   );
// }

// /* =========================================================
//    Report Form
// ========================================================= */

// function ReportForm({
//   students,
//   onClose,
// }: {
//   students: StudentOption[];
//   onClose: () => void;
// }) {
//   const [state, action] = useActionState(
//     submitSpecialistReport,
//     initial
//   );

//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-lg p-5" dir="rtl">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">
//             مذكرة إلى الأخصائي
//           </h3>

//           <button
//             type="button"
//             onClick={onClose}
//             className="text-muted hover:text-ink"
//             aria-label="إغلاق"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <form action={action} className="space-y-3">
//           <div>
//             <label className="block text-xs text-muted mb-1">
//               الطالب *
//             </label>

//             <StudentPicker
//               students={students}
//               name="studentId"
//             />
//           </div>

//           <div>
//             <label className="block text-xs text-muted mb-1">
//               محتوى المذكرة *
//             </label>

//             <textarea
//               name="content"
//               rows={3}
//               required
//               className="input-field text-sm w-full"
//               placeholder="ملاحظات على حالة الطالب..."
//             />
//           </div>

//           <div>
//             <label className="block text-xs text-muted mb-1">
//               مرفق (اختياري — PDF / صورة)
//             </label>

//             <input
//               type="file"
//               name="file"
//               accept=".pdf,.jpg,.jpeg,.png"
//               className="input-field text-sm w-full"
//             />
//           </div>

//           {state.error && (
//             <p className="text-xs text-red-600">
//               {state.error}
//             </p>
//           )}

//           <ReportSubmitButton />
//         </form>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    Committee Form
// ========================================================= */

// function CommitteeForm({
//   students,
//   employees,
//   onClose,
// }: {
//   students: StudentOption[];
//   employees: {
//     id: string;
//     fullName: string;
//   }[];
//   onClose: () => void;
// }) {
//   const [state, action] = useActionState(
//     formProtectionCommittee,
//     initial
//   );

//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
//       <div className="card w-full max-w-lg p-5" dir="rtl">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-display">
//             تشكيل لجنة حماية
//           </h3>

//           <button
//             type="button"
//             onClick={onClose}
//             className="text-muted hover:text-ink"
//             aria-label="إغلاق"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <form action={action} className="space-y-3">
//           <div>
//             <label className="block text-xs text-muted mb-1">
//               الطالب *
//             </label>

//             <StudentPicker
//               students={students}
//               name="studentId"
//             />
//           </div>

//           <div>
//             <label className="block text-xs text-muted mb-1">
//               أعضاء اللجنة
//             </label>

//             <div className="max-h-40 overflow-auto border border-border rounded-sm p-2 space-y-1">
//               {employees.length === 0 ? (
//                 <p className="text-xs text-muted p-2">
//                   لا يوجد موظفون متاحون
//                 </p>
//               ) : (
//                 employees.map((employee) => (
//                   <label
//                     key={employee.id}
//                     className="flex items-center gap-2 text-sm cursor-pointer"
//                   >
//                     <input
//                       type="checkbox"
//                       name="member"
//                       value={employee.id}
//                       className="accent-(--brand)"
//                     />

//                     {employee.fullName}
//                   </label>
//                 ))
//               )}
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs text-muted mb-1">
//               الرأي النهائي (اختياري)
//             </label>

//             <textarea
//               name="finalOpinion"
//               rows={2}
//               className="input-field text-sm w-full"
//             />
//           </div>

//           {state.error && (
//             <p className="text-xs text-red-600">
//               {state.error}
//             </p>
//           )}

//           <CommitteeSubmitButton />
//         </form>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    Decide Form
// ========================================================= */

// function DecideForm({
//   committeeId,
//   onDone,
// }: {
//   committeeId: string;
//   onDone: () => void;
// }) {
//   const [state, action] = useActionState(
//     decideProtectionCommittee.bind(null, committeeId),
//     initial
//   );

//   return (
//     <form
//       action={action}
//       className="space-y-2 bg-paper border border-border rounded-sm p-3"
//     >
//       <div className="flex items-center gap-3">
//         <select
//           name="status"
//           className="input-field text-sm flex-1"
//           defaultValue="open"
//         >
//           <option value="open">مفتوحة</option>
//           <option value="decided">تم البت</option>
//         </select>

//         <DecideSubmitButton />

//         <button
//           type="button"
//           onClick={onDone}
//           className="text-xs text-muted hover:text-ink"
//         >
//           إغلاق
//         </button>
//       </div>

//       <textarea
//         name="finalOpinion"
//         rows={2}
//         placeholder="الرأي النهائي للجنة..."
//         className="input-field text-sm w-full"
//       />

//       {state.error && (
//         <p className="text-xs text-red-600">
//           {state.error}
//         </p>
//       )}
//     </form>
//   );
// }

// /* =========================================================
//    Delete Report Button
// ========================================================= */

// function DeleteReportButton({
//   id,
// }: {
//   id: string;
// }) {
//   const [pending, setPending] = useState(false);

//   async function handleDelete() {
//     const confirmed = window.confirm(
//       'هل أنتِ متأكدة من حذف هذه المذكرة؟'
//     );

//     if (!confirmed) return;

//     setPending(true);

//     try {
//       await deleteSpecialistReport(id);
//     } catch (error) {
//       console.error(
//         'Failed to delete specialist report:',
//         error
//       );
//       window.alert('حدث خطأ أثناء حذف المذكرة');
//     } finally {
//       setPending(false);
//     }
//   }

//   return (
//     <button
//       type="button"
//       onClick={handleDelete}
//       disabled={pending}
//       className="text-xs text-red-600 hover:underline disabled:opacity-50"
//     >
//       {pending ? 'جاري الحذف...' : 'حذف'}
//     </button>
//   );
// }

// /* =========================================================
//    Delete Committee Button
// ========================================================= */

// function DeleteCommitteeButton({
//   id,
// }: {
//   id: string;
// }) {
//   const [pending, setPending] = useState(false);

//   async function handleDelete() {
//     const confirmed = window.confirm(
//       'هل أنتِ متأكدة من حذف هذه اللجنة؟'
//     );

//     if (!confirmed) return;

//     setPending(true);

//     try {
//       await deleteProtectionCommittee(id);
//     } catch (error) {
//       console.error(
//         'Failed to delete protection committee:',
//         error
//       );
//       window.alert('حدث خطأ أثناء حذف اللجنة');
//     } finally {
//       setPending(false);
//     }
//   }

//   return (
//     <button
//       type="button"
//       onClick={handleDelete}
//       disabled={pending}
//       className="text-xs text-red-600 hover:underline disabled:opacity-50"
//     >
//       {pending ? 'جاري الحذف...' : 'حذف'}
//     </button>
//   );
// }

// /* =========================================================
//    Protection Panel
// ========================================================= */

// export function ProtectionPanel({
//   canSubmit,
//   canManage,
//   studentOptions,
//   employees,
//   reports,
//   committees,
// }: {
//   canSubmit: boolean;
//   canManage: boolean;

//   studentOptions: StudentOption[];

//   employees: {
//     id: string;
//     fullName: string;
//   }[];

//   reports: {
//     id: string;
//     studentName: string;
//     studentCode: string;
//     className: string;
//     content: string;
//     fileUrl: string | null;
//     createdAt: string;
//     teacherName: string;
//   }[];

//   committees: {
//     id: string;
//     studentName: string;
//     studentCode: string;
//     className: string;
//     memberNames: string[];
//     status: string;
//     finalOpinion: string | null;
//     createdAt: string;
//   }[];
// }) {
//   const [reportOpen, setReportOpen] =
//     useState(false);

//   const [committeeOpen, setCommitteeOpen] =
//     useState(false);

//   const [deciding, setDeciding] =
//     useState<string | null>(null);

//   return (
//     <div className="space-y-8" dir="rtl">
//       {/* =====================================================
//           Specialist Reports
//       ===================================================== */}

//       <section>
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-medium">
//             مذكرات المعلمين ({reports.length})
//           </h2>

//           {canSubmit && (
//             <button
//               type="button"
//               onClick={() => setReportOpen(true)}
//               className="btn-primary text-sm flex items-center gap-1"
//             >
//               <Plus size={14} />
//               إرسال مذكرة
//             </button>
//           )}
//         </div>

//         <div className="card overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">
//                     التاريخ
//                   </th>

//                   <th className="px-4 py-2 font-medium">
//                     معلم
//                   </th>

//                   <th className="px-4 py-2 font-medium">
//                     الطالب
//                   </th>

//                   <th className="px-4 py-2 font-medium">
//                     المحتوى
//                   </th>

//                   <th className="px-4 py-2 font-medium">
//                     المرفق
//                   </th>

//                   {canSubmit && (
//                     <th className="px-4 py-2 font-medium">
//                       إجراء
//                     </th>
//                   )}
//                 </tr>
//               </thead>

//               <tbody>
//                 {reports.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan={canSubmit ? 6 : 5}
//                       className="px-4 py-6 text-center text-muted"
//                     >
//                       لا توجد مذكرات بعد
//                     </td>
//                   </tr>
//                 )}

//                 {reports.map((report) => (
//                   <tr
//                     key={report.id}
//                     className="border-t border-border align-top"
//                   >
//                     <td className="px-4 py-2 text-muted whitespace-nowrap">
//                       {new Date(
//                         report.createdAt
//                       ).toLocaleDateString('ar-EG')}
//                     </td>

//                     <td className="px-4 py-2">
//                       {report.teacherName}
//                     </td>

//                     <td className="px-4 py-2">
//                       {report.studentName}

//                       <span className="text-xs text-muted block">
//                         {report.studentCode} —{' '}
//                         {report.className}
//                       </span>
//                     </td>

//                     <td className="px-4 py-2">
//                       {report.content}
//                     </td>

//                     <td className="px-4 py-2">
//                       {report.fileUrl ? (
//                         <a
//                           href={report.fileUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-xs text-brand hover:underline"
//                         >
//                           عرض المرفق
//                         </a>
//                       ) : (
//                         <span className="text-xs text-muted">
//                           —
//                         </span>
//                       )}
//                     </td>

//                     {canSubmit && (
//                       <td className="px-4 py-2">
//                         <DeleteReportButton
//                           id={report.id}
//                         />
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>

//       {/* =====================================================
//           Protection Committees
//       ===================================================== */}

//       <section>
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-medium">
//             لجان الحماية ({committees.length})
//           </h2>

//           {canManage && (
//             <button
//               type="button"
//               onClick={() =>
//                 setCommitteeOpen(true)
//               }
//               className="btn-primary text-sm flex items-center gap-1"
//             >
//               <Plus size={14} />
//               تشكيل لجنة
//             </button>
//           )}
//         </div>

//         <div className="space-y-3">
//           {committees.length === 0 && (
//             <div className="card p-6 text-center text-muted text-sm">
//               لا توجد لجان بعد
//             </div>
//           )}

//           {committees.map((committee) => (
//             <div
//               key={committee.id}
//               className="card p-4"
//             >
//               <div className="flex items-start justify-between gap-3 flex-wrap">
//                 <div>
//                   <p className="font-medium">
//                     {committee.studentName}

//                     <span className="text-xs text-muted block">
//                       {committee.studentCode} —{' '}
//                       {committee.className}
//                     </span>
//                   </p>

//                   <p className="text-xs text-muted mt-1">
//                     الأعضاء:{' '}
//                     {committee.memberNames.length
//                       ? committee.memberNames.join('، ')
//                       : 'لم يُحدد أعضاء بعد'}
//                   </p>

//                   <p className="text-xs text-muted mt-1">
//                     تاريخ التشكيل:{' '}
//                     {new Date(
//                       committee.createdAt
//                     ).toLocaleDateString('ar-EG')}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2 flex-wrap">
//                   {committee.status === 'open' ? (
//                     <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
//                       مفتوحة
//                     </span>
//                   ) : (
//                     <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
//                       تم البت
//                     </span>
//                   )}

//                   {canManage && (
//                     <>
//                       <DeleteCommitteeButton
//                         id={committee.id}
//                       />

//                       <button
//                         type="button"
//                         onClick={() =>
//                           setDeciding(
//                             deciding === committee.id
//                               ? null
//                               : committee.id
//                           )
//                         }
//                         className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
//                       >
//                         البت في اللجنة
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>

//               {committee.finalOpinion && (
//                 <p className="mt-3 text-sm bg-paper rounded-sm border border-border p-3">
//                   <span className="font-medium">
//                     الرأي النهائي:{' '}
//                   </span>

//                   {committee.finalOpinion}
//                 </p>
//               )}

//               {deciding === committee.id &&
//                 canManage && (
//                   <div className="mt-3">
//                     <DecideForm
//                       committeeId={committee.id}
//                       onDone={() =>
//                         setDeciding(null)
//                       }
//                     />
//                   </div>
//                 )}
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* =====================================================
//           Modals
//       ===================================================== */}

//       {reportOpen && (
//         <ReportForm
//           students={studentOptions}
//           onClose={() =>
//             setReportOpen(false)
//           }
//         />
//       )}

//       {committeeOpen && (
//         <CommitteeForm
//           students={studentOptions}
//           employees={employees}
//           onClose={() =>
//             setCommitteeOpen(false)
//           }
//         />
//       )}
//     </div>
//   );
// }
// -----------------------------------------------------------------------------------------------
// تعديل عشان الفيال ابلود 

'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, X } from 'lucide-react';
import { StudentPicker } from '@/components/StudentPicker';
import { blobViewUrl } from '@/lib/blob-view-url';
import {
  submitSpecialistReport,
  formProtectionCommittee,
  decideProtectionCommittee,
  deleteSpecialistReport,
  deleteProtectionCommittee,
  type ActionState,
} from './actions';

const initial: ActionState = {};

type StudentOption = {
  id: string;
  fullName: string;
  studentCode?: string;
  className?: string;
};

/* =========================================================
   Report Submit Button
========================================================= */

function ReportSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full text-sm flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          جاري الإرسال...
        </>
      ) : (
        'إرسال المذكرة'
      )}
    </button>
  );
}

/* =========================================================
   Committee Submit Button
========================================================= */

function CommitteeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full text-sm flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          جاري التشكيل...
        </>
      ) : (
        'تشكيل اللجنة'
      )}
    </button>
  );
}

/* =========================================================
   Decide Submit Button
========================================================= */

function DecideSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary text-xs flex items-center gap-1"
    >
      {pending ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          جاري الحفظ...
        </>
      ) : (
        'حفظ'
      )}
    </button>
  );
}

/* =========================================================
   Report Form
========================================================= */

function ReportForm({
  students,
  onClose,
}: {
  students: StudentOption[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(
    submitSpecialistReport,
    initial
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-5" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">
            مذكرة إلى الأخصائي
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">
              الطالب *
            </label>

            <StudentPicker
              students={students}
              name="studentId"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              محتوى المذكرة *
            </label>

            <textarea
              name="content"
              rows={3}
              required
              className="input-field text-sm w-full"
              placeholder="ملاحظات على حالة الطالب..."
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              مرفق (اختياري — PDF / صورة)
            </label>

            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="input-field text-sm w-full"
            />
          </div>

          {state.error && (
            <p className="text-xs text-red-600">
              {state.error}
            </p>
          )}

          <ReportSubmitButton />
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   Committee Form
========================================================= */

function CommitteeForm({
  students,
  employees,
  onClose,
}: {
  students: StudentOption[];
  employees: {
    id: string;
    fullName: string;
  }[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(
    formProtectionCommittee,
    initial
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-5" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">
            تشكيل لجنة حماية
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">
              الطالب *
            </label>

            <StudentPicker
              students={students}
              name="studentId"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              أعضاء اللجنة
            </label>

            <div className="max-h-40 overflow-auto border border-border rounded-sm p-2 space-y-1">
              {employees.length === 0 ? (
                <p className="text-xs text-muted p-2">
                  لا يوجد موظفون متاحون
                </p>
              ) : (
                employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="member"
                      value={employee.id}
                      className="accent-(--brand)"
                    />

                    {employee.fullName}
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              الرأي النهائي (اختياري)
            </label>

            <textarea
              name="finalOpinion"
              rows={2}
              className="input-field text-sm w-full"
            />
          </div>

          {state.error && (
            <p className="text-xs text-red-600">
              {state.error}
            </p>
          )}

          <CommitteeSubmitButton />
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   Decide Form
========================================================= */

function DecideForm({
  committeeId,
  onDone,
}: {
  committeeId: string;
  onDone: () => void;
}) {
  const [state, action] = useActionState(
    decideProtectionCommittee.bind(null, committeeId),
    initial
  );

  return (
    <form
      action={action}
      className="space-y-2 bg-paper border border-border rounded-sm p-3"
    >
      <div className="flex items-center gap-3">
        <select
          name="status"
          className="input-field text-sm flex-1"
          defaultValue="open"
        >
          <option value="open">مفتوحة</option>
          <option value="decided">تم البت</option>
        </select>

        <DecideSubmitButton />

        <button
          type="button"
          onClick={onDone}
          className="text-xs text-muted hover:text-ink"
        >
          إغلاق
        </button>
      </div>

      <textarea
        name="finalOpinion"
        rows={2}
        placeholder="الرأي النهائي للجنة..."
        className="input-field text-sm w-full"
      />

      {state.error && (
        <p className="text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

/* =========================================================
   Delete Report Button
========================================================= */

// function DeleteReportButton({
//   id,
// }: {
//   id: string;
// }) {
//   const [pending, setPending] = useState(false);

//   async function handleDelete() {
//     const confirmed = window.confirm(
//       'هل أنتِ متأكدة من حذف هذه المذكرة؟'
//     );

//     if (!confirmed) return;

//     setPending(true);

//     try {
//       await deleteSpecialistReport(id);
//     } catch (error) {
//       console.error(
//         'Failed to delete specialist report:',
//         error
//       );
//       window.alert('حدث خطأ أثناء حذف المذكرة');
//     } finally {
//       setPending(false);
//     }
//   }

//   return (
//     <button
//       type="button"
//       onClick={handleDelete}
//       disabled={pending}
//       className="text-xs text-red-600 hover:underline disabled:opacity-50"
//     >
//       {pending ? 'جاري الحذف...' : 'حذف'}
//     </button>
//   );
// }
function DeleteReportButton({
  id,
}: {
  id: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      'هل أنتِ متأكدة من حذف هذه المذكرة؟'
    );

    if (!confirmed) return;

    setPending(true);

    try {
      await deleteSpecialistReport(id);
    } catch (error) {
      console.error(
        'Failed to delete specialist report:',
        error
      );
      window.alert('حدث خطأ أثناء حذف المذكرة');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? 'جاري الحذف...' : 'حذف'}
    </button>
  );
}
/* =========================================================
   Delete Committee Button
========================================================= */

// function DeleteCommitteeButton({
//   id,
// }: {
//   id: string;
// }) {
//   const [pending, setPending] = useState(false);

//   async function handleDelete() {
//     const confirmed = window.confirm(
//       'هل أنتِ متأكدة من حذف هذه اللجنة؟'
//     );

//     if (!confirmed) return;

//     setPending(true);

//     try {
//       await deleteProtectionCommittee(id);
//     } catch (error) {
//       console.error(
//         'Failed to delete protection committee:',
//         error
//       );
//       window.alert('حدث خطأ أثناء حذف اللجنة');
//     } finally {
//       setPending(false);
//     }
//   }

//   return (
//     <button
//       type="button"
//       onClick={handleDelete}
//       disabled={pending}
//       className="text-xs text-red-600 hover:underline disabled:opacity-50"
//     >
//       {pending ? 'جاري الحذف...' : 'حذف'}
//     </button>
//   );
// }
function DeleteCommitteeButton({
  id,
}: {
  id: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      'هل أنتِ متأكدة من حذف هذه اللجنة؟'
    );

    if (!confirmed) return;

    setPending(true);

    try {
      await deleteProtectionCommittee(id);
    } catch (error) {
      console.error(
        'Failed to delete protection committee:',
        error
      );
      window.alert('حدث خطأ أثناء حذف اللجنة');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? 'جاري الحذف...' : 'حذف'}
    </button>
  );
}

/* =========================================================
   Protection Panel
========================================================= */

export function ProtectionPanel({
  canSubmit,
  canManage,
  studentOptions,
  employees,
  reports,
  committees,
}: {
  canSubmit: boolean;
  canManage: boolean;

  studentOptions: StudentOption[];

  employees: {
    id: string;
    fullName: string;
  }[];

  reports: {
    id: string;
    studentName: string;
    studentCode: string;
    className: string;
    content: string;
    fileUrl: string | null;
    createdAt: string;
    teacherName: string;
  }[];

  committees: {
    id: string;
    studentName: string;
    studentCode: string;
    className: string;
    memberNames: string[];
    status: string;
    finalOpinion: string | null;
    createdAt: string;
  }[];
}) {
  const [reportOpen, setReportOpen] =
    useState(false);

  const [committeeOpen, setCommitteeOpen] =
    useState(false);

  const [deciding, setDeciding] =
    useState<string | null>(null);

  return (
    <div className="space-y-8" dir="rtl">
      {/* =====================================================
          Specialist Reports
      ===================================================== */}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">
            مذكرات المعلمين ({reports.length})
          </h2>

          {canSubmit && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Plus size={14} />
              إرسال مذكرة
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    التاريخ
                  </th>

                  <th className="px-4 py-2 font-medium">
                    معلم
                  </th>

                  <th className="px-4 py-2 font-medium">
                    الطالب
                  </th>

                  <th className="px-4 py-2 font-medium">
                    المحتوى
                  </th>

                  <th className="px-4 py-2 font-medium">
                    المرفق
                  </th>

                  {canSubmit && (
                    <th className="px-4 py-2 font-medium">
                      إجراء
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {reports.length === 0 && (
                  <tr>
                    <td
                      colSpan={canSubmit ? 6 : 5}
                      className="px-4 py-6 text-center text-muted"
                    >
                      لا توجد مذكرات بعد
                    </td>
                  </tr>
                )}

                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-2 text-muted whitespace-nowrap">
                      {new Date(
                        report.createdAt
                      ).toLocaleDateString('ar-EG')}
                    </td>

                    <td className="px-4 py-2">
                      {report.teacherName}
                    </td>

                    <td className="px-4 py-2">
                      {report.studentName}

                      <span className="text-xs text-muted block">
                        {report.studentCode} —{' '}
                        {report.className}
                      </span>
                    </td>

                    <td className="px-4 py-2">
                      {report.content}
                    </td>

                    <td className="px-4 py-2">
                      {report.fileUrl ? (
                        <a
                          href={blobViewUrl(report.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand hover:underline"
                        >
                          عرض المرفق
                        </a>
                      ) : (
                        <span className="text-xs text-muted">
                          —
                        </span>
                      )}
                    </td>

                    {canSubmit && (
                      <td className="px-4 py-2">
                        <DeleteReportButton
                          id={report.id}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================
          Protection Committees
      ===================================================== */}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">
            لجان الحماية ({committees.length})
          </h2>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                setCommitteeOpen(true)
              }
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Plus size={14} />
              تشكيل لجنة
            </button>
          )}
        </div>

        <div className="space-y-3">
          {committees.length === 0 && (
            <div className="card p-6 text-center text-muted text-sm">
              لا توجد لجان بعد
            </div>
          )}

          {committees.map((committee) => (
            <div
              key={committee.id}
              className="card p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium">
                    {committee.studentName}

                    <span className="text-xs text-muted block">
                      {committee.studentCode} —{' '}
                      {committee.className}
                    </span>
                  </p>

                  <p className="text-xs text-muted mt-1">
                    الأعضاء:{' '}
                    {committee.memberNames.length
                      ? committee.memberNames.join('، ')
                      : 'لم يُحدد أعضاء بعد'}
                  </p>

                  <p className="text-xs text-muted mt-1">
                    تاريخ التشكيل:{' '}
                    {new Date(
                      committee.createdAt
                    ).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {committee.status === 'open' ? (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                      مفتوحة
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                      تم البت
                    </span>
                  )}

                  {canManage && (
                    <>
                      <DeleteCommitteeButton
                        id={committee.id}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setDeciding(
                            deciding === committee.id
                              ? null
                              : committee.id
                          )
                        }
                        className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                      >
                        البت في اللجنة
                      </button>
                    </>
                  )}
                </div>
              </div>

              {committee.finalOpinion && (
                <p className="mt-3 text-sm bg-paper rounded-sm border border-border p-3">
                  <span className="font-medium">
                    الرأي النهائي:{' '}
                  </span>

                  {committee.finalOpinion}
                </p>
              )}

              {deciding === committee.id &&
                canManage && (
                  <div className="mt-3">
                    <DecideForm
                      committeeId={committee.id}
                      onDone={() =>
                        setDeciding(null)
                      }
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          Modals
      ===================================================== */}

      {reportOpen && (
        <ReportForm
          students={studentOptions}
          onClose={() =>
            setReportOpen(false)
          }
        />
      )}

      {committeeOpen && (
        <CommitteeForm
          students={studentOptions}
          employees={employees}
          onClose={() =>
            setCommitteeOpen(false)
          }
        />
      )}
    </div>
  );
}