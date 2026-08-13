// 'use client';

// import { useActionState } from 'react';
// import { useFormStatus } from 'react-dom';
// import { Loader2, Download } from 'lucide-react';
// import { generateDailySummaryDocx, type ActionState } from './actions';

// const initial: ActionState = {};

// function DownloadButton() {
//   const { pending } = useFormStatus();
//   return (
//     <button type="submit" disabled={pending} className="btn-primary text-sm">
//       {pending && <Loader2 size={14} className="animate-spin" />}
//       <Download size={14} className="ml-1" /> تحميل كـ Word
//     </button>
//   );
// }

// export function DailySummaryPanel({
//   selectedDate,
//   studentRate,
//   employeeRate,
//   exams,
//   visits,
//   securitySummary,
//   gateLogs,
//   warnings,
//   qualityIssues,
//   complaints,
//   notices
// }: {
//   selectedDate: string;
//   studentRate: string;
//   employeeRate: string;
//   exams: { id: string; name: string; startDate: string; endDate: string }[];
//   visits: { id: string; type: string; entity: string | null; status: string }[];
//   securitySummary: { id: string; content: string }[];
//   gateLogs: { id: string }[];
//   warnings: { id: string; studentId: string; type: string }[];
//   qualityIssues: { id: string; title: string; status: string }[];
//   complaints: { id: string; type: string; fromType: string; status: string }[];
//   notices: { id: string; content: string }[];
// }) {
//   const [state, action] = useActionState(generateDailySummaryDocx, initial);

//   const handleDownload = (base64: string) => {
//     const link = document.createElement('a');
//     link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
//     link.download = `daily-summary-${selectedDate}.docx`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <form action={action} className="space-y-6">
//       <input type="hidden" name="date" value={selectedDate} />

//       <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
//         <div className="flex items-center gap-3">
//           <label className="text-sm text-muted">التاريخ:</label>
//           <input type="date" name="date" defaultValue={selectedDate} className="input-field text-sm w-48" />
//         </div>
//         <DownloadButton />
//       </div>

//       {state.success && state.blob && (
//         <script
//           dangerouslySetInnerHTML={{
//             __html: `
//               (function() {
//                 const link = document.createElement('a');
//                 link.href = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${state.blob}';
//                 link.download = 'daily-summary-${selectedDate}.docx';
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//               })();
//             `
//           }}
//         />
//       )}
//       {state.error && <p className="text-sm text-red-600">{state.error}</p>}

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">نسب الحضور</h2>
//         <div className="card p-4 grid gap-4 sm:grid-cols-2">
//           <div className="text-center p-4 bg-paper rounded-sm">
//             <p className="text-3xl font-bold text-brand">{studentRate}%</p>
//             <p className="text-sm text-muted">حضور الطلاب</p>
//           </div>
//           <div className="text-center p-4 bg-paper rounded-sm">
//             <p className="text-3xl font-bold text-brand">{employeeRate}%</p>
//             <p className="text-sm text-muted">حضور الموظفين</p>
//           </div>
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">امتحانات اليوم ({exams.length})</h2>
//         <div className="card overflow-hidden">
//           {exams.length === 0 ? (
//             <p className="p-4 text-center text-muted">لا توجد امتحانات مجدولة</p>
//           ) : (
//             <table className="w-full text-sm min-w-[640px]">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">الامتحان</th>
//                   <th className="px-4 py-2 font-medium">من</th>
//                   <th className="px-4 py-2 font-medium">إلى</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {exams.map((e) => (
//                   <tr key={e.id} className="border-t border-border">
//                     <td className="px-4 py-2 font-medium">{e.name}</td>
//                     <td className="px-4 py-2 text-muted">{new Date(e.startDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
//                     <td className="px-4 py-2 text-muted">{new Date(e.endDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">الزيارات ({visits.length})</h2>
//         <div className="card overflow-hidden">
//           {visits.length === 0 ? (
//             <p className="p-4 text-center text-muted">لا توجد زيارات</p>
//           ) : (
//             <table className="w-full text-sm min-w-[640px]">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">النوع</th>
//                   <th className="px-4 py-2 font-medium">الجهة</th>
//                   <th className="px-4 py-2 font-medium">الحالة</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {visits.map((v) => (
//                   <tr key={v.id} className="border-t border-border">
//                     <td className="px-4 py-2">{v.type}</td>
//                     <td className="px-4 py-2">{v.entity ?? '—'}</td>
//                     <td className="px-4 py-2">{v.status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">الأمن</h2>
//         <div className="card p-4 grid gap-4 sm:grid-cols-2">
//           <div>
//             <p className="font-medium">ملخص نهاية اليوم</p>
//             <p className="text-xl font-bold">{securitySummary.length}</p>
//           </div>
//           <div>
//             <p className="font-medium">سجل البوابة</p>
//             <p className="text-xl font-bold">{gateLogs.length} حركة</p>
//           </div>
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">الإنذارات ({warnings.length})</h2>
//         <div className="card overflow-hidden">
//           {warnings.length === 0 ? (
//             <p className="p-4 text-center text-muted">لا توجد إنذارات</p>
//           ) : (
//             <table className="w-full text-sm min-w-[640px]">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">الطالب</th>
//                   <th className="px-4 py-2 font-medium">النوع</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {warnings.map((w) => (
//                   <tr key={w.id} className="border-t border-border">
//                     <td className="px-4 py-2">{w.studentId}</td>
//                     <td className="px-4 py-2">{w.type}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">قضايا الجودة ({qualityIssues.length})</h2>
//         <div className="card overflow-hidden">
//           {qualityIssues.length === 0 ? (
//             <p className="p-4 text-center text-muted">لا توجد قضايا</p>
//           ) : (
//             <table className="w-full text-sm min-w-[640px]">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">العنوان</th>
//                   <th className="px-4 py-2 font-medium">الحالة</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {qualityIssues.map((q) => (
//                   <tr key={q.id} className="border-t border-border">
//                     <td className="px-4 py-2">{q.title}</td>
//                     <td className="px-4 py-2">{q.status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">الشكاوى والمقترحات ({complaints.length})</h2>
//         <div className="card overflow-hidden">
//           {complaints.length === 0 ? (
//             <p className="p-4 text-center text-muted">لا توجد شكاوى</p>
//           ) : (
//             <table className="w-full text-sm min-w-[640px]">
//               <thead className="bg-paper text-muted text-right">
//                 <tr>
//                   <th className="px-4 py-2 font-medium">النوع</th>
//                   <th className="px-4 py-2 font-medium">المصدر</th>
//                   <th className="px-4 py-2 font-medium">الحالة</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {complaints.map((c) => (
//                   <tr key={c.id} className="border-t border-border">
//                     <td className="px-4 py-2">{c.type}</td>
//                     <td className="px-4 py-2">{c.fromType}</td>
//                     <td className="px-4 py-2">{c.status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </section>

//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">الأوامر الإدارية ({notices.length})</h2>
//         <div className="space-y-3">
//           {notices.length === 0 ? (
//             <p className="card p-4 text-center text-muted">لا توجد أوامر</p>
//           ) : (
//             notices.map((n) => (
//               <div key={n.id} className="card p-4 border-t-4 border-brand">
//                 <p className="text-sm">{n.content}</p>
//               </div>
//             ))
//           )}
//         </div>
//       </section>
//     </form>
//   );
// }
// لحد الابديت دا احنا شغالين زي الفل 
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Download } from 'lucide-react';
import { generateDailySummaryDocx, type ActionState } from './actions';

const initial: ActionState = {};

function DownloadButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary text-sm flex items-center gap-2"
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}

      {pending ? 'جاري إنشاء التقرير...' : 'تحميل كـ Word'}
    </button>
  );
}

export function DailySummaryPanel({
  selectedDate,
  studentRate,
  employeeRate,
  exams,
  visits,
  securitySummary,
  gateLogs,
  warnings,
  qualityIssues,
  complaints,
  notices
}: {
  selectedDate: string;
  studentRate: string;
  employeeRate: string;

  exams: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }[];

  visits: {
    id: string;
    type: string;
    entity: string | null;
    status: string;
  }[];

  securitySummary: {
    id: string;
    content: string;
  }[];

  gateLogs: {
    id: string;
  }[];

  warnings: {
    id: string;
    studentId: string;
    type: string;
  }[];

  qualityIssues: {
    id: string;
    title: string;
    status: string;
  }[];

  complaints: {
    id: string;
    type: string;
    fromType: string;
    status: string;
  }[];

  notices: {
    id: string;
    content: string;
  }[];
}) {
  const [state, action] = useActionState(
    generateDailySummaryDocx,
    initial
  );

  /*
   * تحميل ملف Word بعد انتهاء Server Action
   *
   * مهم:
   * لا نستخدم <script> داخل JSX لأن هذا Client Component.
   */
  useEffect(() => {
    if (!state.success || !state.blob) {
      return;
    }

    try {
      const byteCharacters = atob(state.blob);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-summary-${selectedDate}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download daily summary:', error);
    }
  }, [state.success, state.blob, selectedDate]);

  return (
    <form action={action} className="space-y-6">
      {/* Date + Download */}
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">
            التاريخ:
          </label>

          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="input-field text-sm w-48"
          />
        </div>

        <DownloadButton />
      </div>

      {/* Error */}
      {state.error && (
        <div className="rounded-sm border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">
            {state.error}
          </p>
        </div>
      )}

      {/* Attendance */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          نسب الحضور
        </h2>

        <div className="card p-4 grid gap-4 sm:grid-cols-2">
          <div className="text-center p-4 bg-paper rounded-sm">
            <p className="text-3xl font-bold text-brand">
              {studentRate}%
            </p>

            <p className="text-sm text-muted">
              حضور الطلاب
            </p>
          </div>

          <div className="text-center p-4 bg-paper rounded-sm">
            <p className="text-3xl font-bold text-brand">
              {employeeRate}%
            </p>

            <p className="text-sm text-muted">
              حضور الموظفين
            </p>
          </div>
        </div>
      </section>

      {/* Exams */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          امتحانات اليوم ({exams.length})
        </h2>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {exams.length === 0 ? (
            <p className="p-4 text-center text-muted">
              لا توجد امتحانات مجدولة
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    الامتحان
                  </th>

                  <th className="px-4 py-2 font-medium">
                    من
                  </th>

                  <th className="px-4 py-2 font-medium">
                    إلى
                  </th>
                </tr>
              </thead>

              <tbody>
                {exams.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-2 font-medium">
                      {e.name}
                    </td>

                    <td className="px-4 py-2 text-muted">
                      {new Date(e.startDate).toLocaleTimeString(
                        'ar-EG',
                        {
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )}
                    </td>

                    <td className="px-4 py-2 text-muted">
                      {new Date(e.endDate).toLocaleTimeString(
                        'ar-EG',
                        {
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>

      {/* Visits */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          الزيارات ({visits.length})
        </h2>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {visits.length === 0 ? (
            <p className="p-4 text-center text-muted">
              لا توجد زيارات
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    النوع
                  </th>

                  <th className="px-4 py-2 font-medium">
                    الجهة
                  </th>

                  <th className="px-4 py-2 font-medium">
                    الحالة
                  </th>
                </tr>
              </thead>

              <tbody>
                {visits.map((v) => (
                  <tr
                    key={v.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-2">
                      {v.type}
                    </td>

                    <td className="px-4 py-2">
                      {v.entity ?? '—'}
                    </td>

                    <td className="px-4 py-2">
                      {v.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          الأمن
        </h2>

        <div className="card p-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-medium">
              ملخص نهاية اليوم
            </p>

            <p className="text-xl font-bold">
              {securitySummary.length}
            </p>
          </div>

          <div>
            <p className="font-medium">
              سجل البوابة
            </p>

            <p className="text-xl font-bold">
              {gateLogs.length} حركة
            </p>
          </div>
        </div>
      </section>

      {/* Warnings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          الإنذارات ({warnings.length})
        </h2>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {warnings.length === 0 ? (
            <p className="p-4 text-center text-muted">
              لا توجد إنذارات
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    الطالب
                  </th>

                  <th className="px-4 py-2 font-medium">
                    النوع
                  </th>
                </tr>
              </thead>

              <tbody>
                {warnings.map((w) => (
                  <tr
                    key={w.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-2">
                      {w.studentId}
                    </td>

                    <td className="px-4 py-2">
                      {w.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          قضايا الجودة ({qualityIssues.length})
        </h2>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {qualityIssues.length === 0 ? (
            <p className="p-4 text-center text-muted">
              لا توجد قضايا
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    العنوان
                  </th>

                  <th className="px-4 py-2 font-medium">
                    الحالة
                  </th>
                </tr>
              </thead>

              <tbody>
                {qualityIssues.map((q) => (
                  <tr
                    key={q.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-2">
                      {q.title}
                    </td>

                    <td className="px-4 py-2">
                      {q.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>

      {/* Complaints */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          الشكاوى والمقترحات ({complaints.length})
        </h2>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {complaints.length === 0 ? (
            <p className="p-4 text-center text-muted">
              لا توجد شكاوى
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">
                    النوع
                  </th>

                  <th className="px-4 py-2 font-medium">
                    المصدر
                  </th>

                  <th className="px-4 py-2 font-medium">
                    الحالة
                  </th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-2">
                      {c.type}
                    </td>

                    <td className="px-4 py-2">
                      {c.fromType}
                    </td>

                    <td className="px-4 py-2">
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>

      {/* Notices */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          الأوامر الإدارية ({notices.length})
        </h2>

        <div className="space-y-3">
          {notices.length === 0 ? (
            <p className="card p-4 text-center text-muted">
              لا توجد أوامر
            </p>
          ) : (
            notices.map((n) => (
              <div
                key={n.id}
                className="card p-4 border-t-4 border-brand"
              >
                <p className="text-sm">
                  {n.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </form>
  );
}