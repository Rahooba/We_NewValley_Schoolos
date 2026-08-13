// 'use server';

// import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
// import { auth } from '@/lib/auth';
// import { prisma } from '@/lib/prisma';

// async function requirePermission(permission: string) {
//   const session = await auth();
//   const permissions = ((session?.user as any)?.permissions ?? []) as string[];
//   return !!session && permissions.includes(permission);
// }

// export type ActionState = { error?: string; success?: boolean; blob?: string };

// function formatDateDisplay(date: Date): string {
//   return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
// }

// function bold(text: string): TextRun {
//   return new TextRun({ text, bold: true });
// }

// async function getDailyData(date: Date) {
//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);
//   const end = new Date(start.getTime() + 86400000);

//   const [students, employees, exams, visits, securitySummary, gateLogs, warnings, qualityIssues, complaints, notices] =
//     await Promise.all([
//       prisma.student.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.employee.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.exam.findMany({ where: { startDate: { gte: start, lt: end } } }),
//       prisma.visit.findMany({ where: { plannedVisitDate: { gte: start, lt: end } } }),
//       prisma.securityDailySummary.findMany({ where: { date: { gte: start, lt: end } } }),
//       prisma.gateLog.findMany({ where: { timestamp: { gte: start, lt: end } } }),
//       prisma.warningLog.findMany({ where: { warningDate: { gte: start, lt: end } } }),
//       prisma.improvementPlan.findMany({ where: { dueDate: { gte: start, lt: end } } }),
//       prisma.complaint.findMany({ where: { createdAt: { gte: start, lt: end } } }),
//       prisma.adminNotice.findMany({ where: { date: { gte: start, lt: end } } })
//     ]);

//   const [studentAttendance, employeeAttendance] = await Promise.all([
//     prisma.studentAttendance.groupBy({
//       by: ['status'],
//       where: { date: { gte: start, lt: end } },
//       _count: { status: true }
//     }),
//     prisma.employeeAttendance.groupBy({
//       by: ['status'],
//       where: { date: { gte: start, lt: end } },
//       _count: { status: true }
//     })
//   ]);

//   const studentPresent = studentAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const studentTotal = students.length;
//   const studentRate = studentTotal > 0 ? ((studentPresent / studentTotal) * 100).toFixed(1) : '0';

//   const employeePresent = employeeAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const employeeTotal = employees.length;
//   const employeeRate = employeeTotal > 0 ? ((employeePresent / employeeTotal) * 100).toFixed(1) : '0';

//   return {
//     date,
//     studentRate,
//     employeeRate,
//     exams,
//     visits,
//     securitySummary,
//     gateLogs,
//     warnings,
//     qualityIssues,
//     complaints,
//     notices
//   };
// }

// function headerRow(cells: string[]): TableRow {
//   return new TableRow({
//     children: cells.map((c) =>
//       new TableCell({
//         children: [new Paragraph({ children: [bold(c)], alignment: AlignmentType.CENTER })],
//         width: { size: 100 / cells.length, type: WidthType.PERCENTAGE }
//       })
//     )
//   });
// }

// function dataRow(cells: (string | TextRun)[], widths?: number[]): TableRow {
//   return new TableRow({
//     children: cells.map((c, i) =>
//       new TableCell({
//         children: [new Paragraph({ children: [typeof c === 'string' ? new TextRun(c) : c] })],
//         width: widths ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined
//       })
//     )
//   });
// }

// const buildDocx = async (data: Awaited<ReturnType<typeof getDailyData>>): Promise<Uint8Array> => {
//   const doc = new Document({
//     sections: [
//       {
//         properties: {},
//         children: [
//           new Paragraph({ children: [bold('ملخص نهاية اليوم')], heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
//           new Paragraph({ children: [new TextRun(`التاريخ: ${formatDateDisplay(data.date)}`)], heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Attendance
//           new Paragraph({ children: [bold('نسب الحضور')], heading: HeadingLevel.HEADING_2 }),
//           new Table({
//             rows: [
//               headerRow(['النوع', 'المعدل']),
//               dataRow([`الطلاب`, `${data.studentRate}%`]),
//               dataRow([`الموظفون`, `${data.employeeRate}%`])
//             ]
//           }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Exams
//           new Paragraph({ children: [bold('امتحانات اليوم')], heading: HeadingLevel.HEADING_2 }),
//           data.exams.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد امتحانات مجدولة لهذا اليوم')] })
//             : new Table({
//                 rows: [
//                   headerRow(['الامتحان', 'من', 'إلى']),
//                   ...data.exams.map((e) =>
//                     dataRow([
//                       e.name,
//                       new Date(e.startDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
//                       new Date(e.endDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
//                     ])
//                   )
//                 ]
//               }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Visits
//           new Paragraph({ children: [bold('الزيارات')], heading: HeadingLevel.HEADING_2 }),
//           data.visits.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد زيارات مسجلة')] })
//             : new Table({
//                 rows: [
//                   headerRow(['النوع', 'الجهة', 'الحالة']),
//                   ...data.visits.map((v) =>
//                     dataRow([v.purpose ?? 'زيارة', v.visitor ?? '—', v.status])
//                   )
//                 ]
//               }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Security
//           new Paragraph({ children: [bold('الأمن')], heading: HeadingLevel.HEADING_2 }),
//           new Paragraph({ children: [new TextRun(`ملخص نهاية اليوم: ${data.securitySummary.length} — سجل البوابة: ${data.gateLogs.length} دخول/خروج`)] }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Warnings
//           new Paragraph({ children: [bold('الإنذارات')], heading: HeadingLevel.HEADING_2 }),
//           data.warnings.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد إنذارات اليوم')] })
//             : new Table({
//                 rows: [
//                   headerRow(['الطالب', 'النوع']),
//                   ...data.warnings.map((w) =>
//                     dataRow([w.studentId, w.reason ?? '—'])
//                   )
//                 ]
//               }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Quality issues
//           new Paragraph({ children: [bold('قضايا الجودة')], heading: HeadingLevel.HEADING_2 }),
//           data.qualityIssues.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد قضايا جودة جديدة')] })
//             : new Table({
//                 rows: [
//                   headerRow(['العنوان', 'الحالة']),
//                   ...data.qualityIssues.map((q) =>
//                     dataRow([q.title, q.status])
//                   )
//                 ]
//               }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Complaints
//           new Paragraph({ children: [bold('الشكاوى والمقترحات')], heading: HeadingLevel.HEADING_2 }),
//           data.complaints.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد شكاوى اليوم')] })
//             : new Table({
//                 rows: [
//                   headerRow(['النوع', 'المصدر', 'الحالة']),
//                   ...data.complaints.map((c) =>
//                     dataRow([c.type, c.fromType, c.status])
//                   )
//                 ]
//               }),
//           new Paragraph({ children: [new TextRun('')] }),

//           // Notices
//           new Paragraph({ children: [bold('الأوامر الإدارية')], heading: HeadingLevel.HEADING_2 }),
//           data.notices.length === 0
//             ? new Paragraph({ children: [new TextRun('لا توجد أوامر إدارية اليوم')] })
//             : new Table({
//                 rows: [
//                   headerRow(['المحتوى']),
//                   ...data.notices.map((n) =>
//                     dataRow([n.content])
//                   )
//                 ]
//               })
//         ]
//       }
//     ]
//   });

//   const buffer = await Packer.toBuffer(doc);
//     return new Uint8Array(buffer);
// }

// export async function generateDailySummaryDocx(
//   _prev: ActionState,
//   formData: FormData
// ): Promise<ActionState> {
//   if (!(await requirePermission('reports.view'))) return { error: 'ليس لديك صلاحية' };

//   const dateStr = String(formData.get('date') ?? '');
//   const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();

//   try {
//     const data = await getDailyData(date);
//     const buffer = await buildDocx(data);
//     const base64 = Buffer.from(buffer).toString('base64');
//     return { success: true, blob: base64 };
//   } catch (err) {
//     console.error('generateDailySummaryDocx failed', err);
//     return { error: 'حدث خطأ أثناء إنشاء المستند' };
//   }
// }

// ----------------------------------------------------------------------------------------------------------------
// // غيرت الشكل والتنسيقات بتاعه ملف الورد الي طالع ولحد هنا الدنيا حلوه وشغاله 
// 'use server';

// import {
//   Document,
//   Packer,
//   Paragraph,
//   TextRun,
//   Table,
//   TableRow,
//   TableCell,
//   WidthType,
//   ShadingType,
//   BorderStyle,
//   AlignmentType,
//   HeadingLevel,
//   ImageRun,
//   VerticalAlign,
//   TableLayoutType
// } from 'docx';
// import fs from 'fs';
// import path from 'path';
// import { auth } from '@/lib/auth';
// import { prisma } from '@/lib/prisma';

// async function requirePermission(permission: string) {
//   const session = await auth();
//   const permissions = ((session?.user as any)?.permissions ?? []) as string[];
//   return !!session && permissions.includes(permission);
// }

// export type ActionState = { error?: string; success?: boolean; blob?: string };

// function formatDateDisplay(date: Date): string {
//   return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
// }

// // ---------------------------------------------------------------------------
// // Theme (WE purple + white) — kept in one place so future palette tweaks
// // only touch this block.
// // ---------------------------------------------------------------------------
// const PURPLE_DARK = '461E81'; // primary brand purple
// const PURPLE = '5C2D91'; // main accent purple (table headers)
// const PURPLE_MEDIUM = '8862B8'; // borders / secondary text
// const PURPLE_LIGHT = 'EDE6F5'; // notice box fill
// const PURPLE_LIGHTER = 'F7F4FB'; // alternate row fill
// const WHITE = 'FFFFFF';
// const TEXT_DARK = '2B1B40';
// const FONT = 'Arial';
// const TABLE_WIDTH = 9360; // DXA, ~6.5in usable width on A4 with 900 twip margins

// // Path to the header logo strip image bundled with the project.
// const LOGO_PATH = path.join(process.cwd(), 'public', 'logos-header.png');

// function cellBorders() {
//   return {
//     top: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
//     bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
//     left: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
//     right: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM }
//   };
// }

// function sectionHeading(text: string): Paragraph {
//   return new Paragraph({
//     heading: HeadingLevel.HEADING_1,
//     alignment: AlignmentType.RIGHT,
//     bidirectional: true,
//     spacing: { before: 320, after: 160 },
//     border: {
//       bottom: { color: PURPLE, space: 4, style: BorderStyle.SINGLE, size: 8 }
//     },
//     children: [new TextRun({ text, bold: true, color: PURPLE_DARK, size: 28, font: FONT })]
//   });
// }

// function headerCell(text: string, width: number): TableCell {
//   return new TableCell({
//     width: { size: width, type: WidthType.DXA },
//     shading: { type: ShadingType.CLEAR, color: 'auto', fill: PURPLE },
//     verticalAlign: VerticalAlign.CENTER,
//     margins: { top: 100, bottom: 100, left: 150, right: 150 },
//     borders: cellBorders(),
//     children: [
//       new Paragraph({
//         alignment: AlignmentType.CENTER,
//         bidirectional: true,
//         children: [new TextRun({ text, bold: true, color: WHITE, size: 22, font: FONT })]
//       })
//     ]
//   });
// }

// function bodyCell(text: string, width: number, opts: { fill?: string; bold?: boolean; color?: string } = {}): TableCell {
//   return new TableCell({
//     width: { size: width, type: WidthType.DXA },
//     shading: { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill || WHITE },
//     verticalAlign: VerticalAlign.CENTER,
//     margins: { top: 100, bottom: 100, left: 150, right: 150 },
//     borders: cellBorders(),
//     children: [
//       new Paragraph({
//         alignment: AlignmentType.CENTER,
//         bidirectional: true,
//         children: [
//           new TextRun({ text, bold: opts.bold || false, color: opts.color || TEXT_DARK, size: 22, font: FONT })
//         ]
//       })
//     ]
//   });
// }

// /**
//  * Generic themed table builder: N equal-width columns, purple header row,
//  * alternating white / light-purple body rows. First column of each body
//  * row is bolded + dark purple to read like a label (matches the two-column
//  * attendance table look from the sample).
//  */
// function themedTable(headers: string[], rows: string[][]): Table {
//   const colWidth = Math.floor(TABLE_WIDTH / headers.length);
//   const colWidths = headers.map((_, i) =>
//     i === headers.length - 1 ? TABLE_WIDTH - colWidth * (headers.length - 1) : colWidth
//   );

//   return new Table({
//     width: { size: TABLE_WIDTH, type: WidthType.DXA },
//     columnWidths: colWidths,
//     layout: TableLayoutType.FIXED,
//     rows: [
//       new TableRow({
//         tableHeader: true,
//         children: headers.map((h, i) => headerCell(h, colWidths[i]))
//       }),
//       ...rows.map(
//         (r, rowIndex) =>
//           new TableRow({
//             children: r.map((cellText, colIndex) =>
//               bodyCell(cellText, colWidths[colIndex], {
//                 fill: rowIndex % 2 === 0 ? WHITE : PURPLE_LIGHTER,
//                 bold: colIndex === 0,
//                 color: colIndex === 0 ? PURPLE_DARK : TEXT_DARK
//               })
//             )
//           })
//       )
//     ]
//   });
// }

// /** Light-purple single-row banner used for "no data" states. */
// function noticeTable(text: string): Table {
//   return new Table({
//     width: { size: TABLE_WIDTH, type: WidthType.DXA },
//     columnWidths: [TABLE_WIDTH],
//     layout: TableLayoutType.FIXED,
//     rows: [
//       new TableRow({
//         children: [
//           new TableCell({
//             width: { size: TABLE_WIDTH, type: WidthType.DXA },
//             shading: { type: ShadingType.CLEAR, color: 'auto', fill: PURPLE_LIGHT },
//             borders: cellBorders(),
//             margins: { top: 160, bottom: 160, left: 200, right: 200 },
//             children: [
//               new Paragraph({
//                 alignment: AlignmentType.CENTER,
//                 bidirectional: true,
//                 children: [new TextRun({ text, color: PURPLE_DARK, size: 22, font: FONT, italics: true })]
//               })
//             ]
//           })
//         ]
//       })
//     ]
//   });
// }

// // ---------------------------------------------------------------------------
// // Data fetching (unchanged)
// // ---------------------------------------------------------------------------
// async function getDailyData(date: Date) {
//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);
//   const end = new Date(start.getTime() + 86400000);

//   const [students, employees, exams, visits, securitySummary, gateLogs, warnings, qualityIssues, complaints, notices] =
//     await Promise.all([
//       prisma.student.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.employee.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.exam.findMany({ where: { startDate: { gte: start, lt: end } } }),
//       prisma.visit.findMany({ where: { plannedVisitDate: { gte: start, lt: end } } }),
//       prisma.securityDailySummary.findMany({ where: { date: { gte: start, lt: end } } }),
//       prisma.gateLog.findMany({ where: { timestamp: { gte: start, lt: end } } }),
//       prisma.warningLog.findMany({ where: { warningDate: { gte: start, lt: end } } }),
//       prisma.improvementPlan.findMany({ where: { dueDate: { gte: start, lt: end } } }),
//       prisma.complaint.findMany({ where: { createdAt: { gte: start, lt: end } } }),
//       prisma.adminNotice.findMany({ where: { date: { gte: start, lt: end } } })
//     ]);

//   const [studentAttendance, employeeAttendance] = await Promise.all([
//     prisma.studentAttendance.groupBy({
//       by: ['status'],
//       where: { date: { gte: start, lt: end } },
//       _count: { status: true }
//     }),
//     prisma.employeeAttendance.groupBy({
//       by: ['status'],
//       where: { date: { gte: start, lt: end } },
//       _count: { status: true }
//     })
//   ]);

//   const studentPresent = studentAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const studentTotal = students.length;
//   const studentRate = studentTotal > 0 ? ((studentPresent / studentTotal) * 100).toFixed(1) : '0';

//   const employeePresent = employeeAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const employeeTotal = employees.length;
//   const employeeRate = employeeTotal > 0 ? ((employeePresent / employeeTotal) * 100).toFixed(1) : '0';

//   return {
//     date,
//     studentRate,
//     employeeRate,
//     exams,
//     visits,
//     securitySummary,
//     gateLogs,
//     warnings,
//     qualityIssues,
//     complaints,
//     notices
//   };
// }

// // ---------------------------------------------------------------------------
// // Document builder
// // ---------------------------------------------------------------------------
// const buildDocx = async (data: Awaited<ReturnType<typeof getDailyData>>): Promise<Uint8Array> => {
//   // Header logo strip — keep aspect ratio of the source (1983x793).
//   const logoBuffer = fs.readFileSync(LOGO_PATH);
//   const imgWidth = 620;
//   const imgHeight = Math.round(imgWidth * (293 / 1983));

//   const doc = new Document({
//     sections: [
//       {
//         properties: {
//           page: {
//             size: { width: 11906, height: 16838 }, // A4
//             margin: { top: 900, bottom: 900, left: 900, right: 900 }
//           }
//         },
//         children: [
//           // Header image
//           new Paragraph({
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 200 },
//             children: [
//               new ImageRun({
//                 type: 'png',
//                 data: logoBuffer,
//                 transformation: { width: imgWidth, height: imgHeight }
//               })
//             ]
//           }),
//           // Purple divider under header
//           new Paragraph({
//             spacing: { after: 240 },
//             border: { bottom: { color: PURPLE, space: 1, style: BorderStyle.SINGLE, size: 18 } },
//             children: []
//           }),
//           // Title
//           new Paragraph({
//             alignment: AlignmentType.CENTER,
//             bidirectional: true,
//             spacing: { after: 80 },
//             children: [new TextRun({ text: 'ملخص نهاية اليوم', bold: true, color: PURPLE_DARK, size: 40, font: FONT })]
//           }),
//           new Paragraph({
//             alignment: AlignmentType.CENTER,
//             bidirectional: true,
//             spacing: { after: 320 },
//             children: [
//               new TextRun({
//                 text: `التاريخ: ${formatDateDisplay(data.date)}`,
//                 bold: true,
//                 color: PURPLE_MEDIUM,
//                 size: 24,
//                 font: FONT
//               })
//             ]
//           }),

//           // Attendance
//           sectionHeading('نسب الحضور'),
//           themedTable(
//             ['النوع', 'المعدل'],
//             [
//               ['الطلاب', `${data.studentRate}%`],
//               ['الموظفون', `${data.employeeRate}%`]
//             ]
//           ),

//           // Exams
//           sectionHeading('امتحانات اليوم'),
//           data.exams.length === 0
//             ? noticeTable('لا توجد امتحانات مجدولة لهذا اليوم')
//             : themedTable(
//                 ['الامتحان', 'من', 'إلى'],
//                 data.exams.map((e) => [
//                   e.name,
//                   new Date(e.startDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
//                   new Date(e.endDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
//                 ])
//               ),

//           // Visits
//           sectionHeading('الزيارات'),
//           data.visits.length === 0
//             ? noticeTable('لا توجد زيارات مسجلة')
//             : themedTable(
//                 ['النوع', 'الجهة', 'الحالة'],
//                 data.visits.map((v) => [v.purpose ?? 'زيارة', v.visitor ?? '—', v.status])
//               ),

//           // Security
//           sectionHeading('الأمن'),
//           noticeTable(
//             `ملخص نهاية اليوم: ${data.securitySummary.length} — سجل البوابة: ${data.gateLogs.length} دخول/خروج`
//           ),

//           // Warnings
//           sectionHeading('الإنذارات'),
//           data.warnings.length === 0
//             ? noticeTable('لا توجد إنذارات اليوم')
//             : themedTable(
//                 ['الطالب', 'النوع'],
//                 data.warnings.map((w) => [w.studentId, w.reason ?? '—'])
//               ),

//           // Quality issues
//           sectionHeading('قضايا الجودة'),
//           data.qualityIssues.length === 0
//             ? noticeTable('لا توجد قضايا جودة جديدة')
//             : themedTable(
//                 ['العنوان', 'الحالة'],
//                 data.qualityIssues.map((q) => [q.title, q.status])
//               ),

//           // Complaints
//           sectionHeading('الشكاوى والمقترحات'),
//           data.complaints.length === 0
//             ? noticeTable('لا توجد شكاوى اليوم')
//             : themedTable(
//                 ['النوع', 'المصدر', 'الحالة'],
//                 data.complaints.map((c) => [c.type, c.fromType, c.status])
//               ),

//           // Admin notices
//           sectionHeading('الأوامر الإدارية'),
//           data.notices.length === 0
//             ? noticeTable('لا توجد أوامر إدارية اليوم')
//             : themedTable(
//                 ['المحتوى'],
//                 data.notices.map((n) => [n.content])
//               )
//         ]
//       }
//     ]
//   });

//   const buffer = await Packer.toBuffer(doc);
//   return new Uint8Array(buffer);
// };

// export async function generateDailySummaryDocx(
//   _prev: ActionState,
//   formData: FormData
// ): Promise<ActionState> {
//   if (!(await requirePermission('reports.view'))) return { error: 'ليس لديك صلاحية' };

//   const dateStr = String(formData.get('date') ?? '');
//   const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();

//   try {
//     const data = await getDailyData(date);
//     const buffer = await buildDocx(data);
//     const base64 = Buffer.from(buffer).toString('base64');
//     return { success: true, blob: base64 };
//   } catch (err) {
//     console.error('generateDailySummaryDocx failed', err);
//     return { error: 'حدث خطأ أثناء إنشاء المستند' };
//   }
// }
// -----------------------------------------------------------------------------------------------------------------------
// // هنا بقي بغير اتجاه الكتابه في الفايل 
'use server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  VerticalAlign,
  TableLayoutType
} from 'docx';
import fs from 'fs';
import path from 'path';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean; blob?: string };

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Arabic text run: always marks the run itself as right-to-left (w:rtl)
 * on top of the paragraph-level `bidirectional` flag, so Word treats the
 * script direction correctly everywhere (headings, cells, titles).
 */
function arRun(text: string, opts: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || TEXT_DARK,
    size: opts.size || 22,
    font: FONT,
    rightToLeft: true
  });
}

// ---------------------------------------------------------------------------
// Theme (WE purple + white) — kept in one place so future palette tweaks
// only touch this block.
// ---------------------------------------------------------------------------
const PURPLE_DARK = '461E81'; // primary brand purple
const PURPLE = '5C2D91'; // main accent purple (table headers)
const PURPLE_MEDIUM = '8862B8'; // borders / secondary text
const PURPLE_LIGHT = 'EDE6F5'; // notice box fill
const PURPLE_LIGHTER = 'F7F4FB'; // alternate row fill
const WHITE = 'FFFFFF';
const TEXT_DARK = '2B1B40';
const FONT = 'Arial';
const TABLE_WIDTH = 9360; // DXA, ~6.5in usable width on A4 with 900 twip margins

// Path to the header logo strip image bundled with the project.
const LOGO_PATH = path.join(process.cwd(), 'public', 'logos-header.png');

function cellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
    left: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM },
    right: { style: BorderStyle.SINGLE, size: 4, color: PURPLE_MEDIUM }
  };
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.START,
    bidirectional: true,
    spacing: { before: 320, after: 160 },
    border: {
      bottom: { color: PURPLE, space: 4, style: BorderStyle.SINGLE, size: 8 }
    },
    children: [arRun(text, { bold: true, color: PURPLE_DARK, size: 28 })]
  });
}

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: PURPLE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    borders: cellBorders(),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [arRun(text, { bold: true, color: WHITE, size: 22 })]
      })
    ]
  });
}

function bodyCell(text: string, width: number, opts: { fill?: string; bold?: boolean; color?: string } = {}): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill || WHITE },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    borders: cellBorders(),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [arRun(text, { bold: opts.bold || false, color: opts.color || TEXT_DARK, size: 22 })]
      })
    ]
  });
}

/**
 * Generic themed table builder: N equal-width columns, purple header row,
 * alternating white / light-purple body rows. First column of each body
 * row is bolded + dark purple to read like a label (matches the two-column
 * attendance table look from the sample).
 */
function themedTable(headers: string[], rows: string[][]): Table {
  const colWidth = Math.floor(TABLE_WIDTH / headers.length);
  const colWidths = headers.map((_, i) =>
    i === headers.length - 1 ? TABLE_WIDTH - colWidth * (headers.length - 1) : colWidth
  );

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
    visuallyRightToLeft: true,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths[i]))
      }),
      ...rows.map(
        (r, rowIndex) =>
          new TableRow({
            children: r.map((cellText, colIndex) =>
              bodyCell(cellText, colWidths[colIndex], {
                fill: rowIndex % 2 === 0 ? WHITE : PURPLE_LIGHTER,
                bold: colIndex === 0,
                color: colIndex === 0 ? PURPLE_DARK : TEXT_DARK
              })
            )
          })
      )
    ]
  });
}

/** Light-purple single-row banner used for "no data" states. */
function noticeTable(text: string): Table {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    layout: TableLayoutType.FIXED,
    visuallyRightToLeft: true,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TABLE_WIDTH, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: PURPLE_LIGHT },
            borders: cellBorders(),
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [arRun(text, { color: PURPLE_DARK, size: 22, italics: true })]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ---------------------------------------------------------------------------
// Data fetching (unchanged)
// ---------------------------------------------------------------------------
async function getDailyData(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400000);

  const [students, employees, exams, visits, securitySummary, gateLogs, warnings, qualityIssues, complaints, notices] =
    await Promise.all([
      prisma.student.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
      prisma.employee.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
      prisma.exam.findMany({ where: { startDate: { gte: start, lt: end } } }),
      prisma.visit.findMany({ where: { plannedVisitDate: { gte: start, lt: end } } }),
      prisma.securityDailySummary.findMany({ where: { date: { gte: start, lt: end } } }),
      prisma.gateLog.findMany({ where: { timestamp: { gte: start, lt: end } } }),
      prisma.warningLog.findMany({ where: { warningDate: { gte: start, lt: end } } }),
      prisma.improvementPlan.findMany({ where: { dueDate: { gte: start, lt: end } } }),
      prisma.complaint.findMany({ where: { createdAt: { gte: start, lt: end } } }),
      prisma.adminNotice.findMany({ where: { date: { gte: start, lt: end } } })
    ]);

  const [studentAttendance, employeeAttendance] = await Promise.all([
    prisma.studentAttendance.groupBy({
      by: ['status'],
      where: { date: { gte: start, lt: end } },
      _count: { status: true }
    }),
    prisma.employeeAttendance.groupBy({
      by: ['status'],
      where: { date: { gte: start, lt: end } },
      _count: { status: true }
    })
  ]);

  const studentPresent = studentAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
  const studentTotal = students.length;
  const studentRate = studentTotal > 0 ? ((studentPresent / studentTotal) * 100).toFixed(1) : '0';

  const employeePresent = employeeAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
  const employeeTotal = employees.length;
  const employeeRate = employeeTotal > 0 ? ((employeePresent / employeeTotal) * 100).toFixed(1) : '0';

  return {
    date,
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
  };
}
// ---------------------------------------------------------------------------
// Document builder
// ---------------------------------------------------------------------------
const buildDocx = async (data: Awaited<ReturnType<typeof getDailyData>>): Promise<Uint8Array> => {
  // Header logo strip — keep aspect ratio of the source (1983x793).
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  const imgWidth = 620;
  const imgHeight = Math.round(imgWidth * (793 / 1983));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, rightToLeft: true },
          paragraph: {}
        },
        heading1: {
          run: { rightToLeft: true, color: PURPLE_DARK, size: 28, font: FONT },
          paragraph: { alignment: AlignmentType.START }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 900, bottom: 900, left: 900, right: 900 }
          }
        },
        children: [
          // Header image
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                type: 'png',
                data: logoBuffer,
                transformation: { width: imgWidth, height: imgHeight }
              })
            ]
          }),
          // Purple divider under header
          new Paragraph({
            spacing: { after: 240 },
            border: { bottom: { color: PURPLE, space: 1, style: BorderStyle.SINGLE, size: 18 } },
            children: []
          }),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 80 },
            children: [arRun('ملخص نهاية اليوم', { bold: true, color: PURPLE_DARK, size: 40 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 320 },
            children: [arRun(`التاريخ: ${formatDateDisplay(data.date)}`, { bold: true, color: PURPLE_MEDIUM, size: 24 })]
          }),

          // Attendance
          sectionHeading('نسب الحضور'),
          themedTable(
            ['النوع', 'المعدل'],
            [
              ['الطلاب', `${data.studentRate}%`],
              ['الموظفون', `${data.employeeRate}%`]
            ]
          ),

          // Exams
          sectionHeading('امتحانات اليوم'),
          data.exams.length === 0
            ? noticeTable('لا توجد امتحانات مجدولة لهذا اليوم')
            : themedTable(
                ['الامتحان', 'من', 'إلى'],
                data.exams.map((e) => [
                  e.name,
                  new Date(e.startDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                  new Date(e.endDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                ])
              ),

          // Visits
          sectionHeading('الزيارات'),
          data.visits.length === 0
            ? noticeTable('لا توجد زيارات مسجلة')
            : themedTable(
                ['النوع', 'الجهة', 'الحالة'],
                data.visits.map((v) => [v.purpose ?? 'زيارة', v.visitor ?? '—', v.status])
              ),

          // Security
          sectionHeading('الأمن'),
          noticeTable(
            `ملخص نهاية اليوم: ${data.securitySummary.length} — سجل البوابة: ${data.gateLogs.length} دخول/خروج`
          ),

          // Warnings
          sectionHeading('الإنذارات'),
          data.warnings.length === 0
            ? noticeTable('لا توجد إنذارات اليوم')
            : themedTable(
                ['الطالب', 'النوع'],
                data.warnings.map((w) => [w.studentId, w.reason ?? '—'])
              ),

          // Quality issues
          sectionHeading('قضايا الجودة'),
          data.qualityIssues.length === 0
            ? noticeTable('لا توجد قضايا جودة جديدة')
            : themedTable(
                ['العنوان', 'الحالة'],
                data.qualityIssues.map((q) => [q.title, q.status])
              ),

          // Complaints
          sectionHeading('الشكاوى والمقترحات'),
          data.complaints.length === 0
            ? noticeTable('لا توجد شكاوى اليوم')
            : themedTable(
                ['النوع', 'المصدر', 'الحالة'],
                data.complaints.map((c) => [c.type, c.fromType, c.status])
              ),

          // Admin notices
          sectionHeading('الأوامر الإدارية'),
          data.notices.length === 0
            ? noticeTable('لا توجد أوامر إدارية اليوم')
            : themedTable(
                ['المحتوى'],
                data.notices.map((n) => [n.content])
              )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
};

export async function generateDailySummaryDocx(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('reports.view'))) return { error: 'ليس لديك صلاحية' };

  const dateStr = String(formData.get('date') ?? '');
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();

  try {
    const data = await getDailyData(date);
    const buffer = await buildDocx(data);
    const base64 = Buffer.from(buffer).toString('base64');
    return { success: true, blob: base64 };
  } catch (err) {
    console.error('generateDailySummaryDocx failed', err);
    return { error: 'حدث خطأ أثناء إنشاء المستند' };
  }
}

