import type { SpecializationGroup } from '@/lib/exams/specialization-report';

function fmtPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

export function ReportTypeB({
  group,
  gradeLevel,
  remedialThreshold
}: {
  group: SpecializationGroup;
  gradeLevel: number;
  remedialThreshold: number;
}) {
  const { className, scoreBands, totalScoreBand } = group;
  const allBands = [...scoreBands, totalScoreBand];

  // Compute averages for the bottom row
  const avgRow = {
    subject: 'المتوسط',
    totalAttended: totalScoreBand.totalAttended,
    bandLT50: totalScoreBand.bandLT50,
    band50to65: totalScoreBand.band50to65,
    band65to85: totalScoreBand.band65to85,
    bandGT85: totalScoreBand.bandGT85,
    bandGE65: totalScoreBand.bandGE65,
    successCount: totalScoreBand.successCount,
    successRate: totalScoreBand.successRate
  };

  const titleSuffix = className === 'جميع التخصصات' ? 'جميع التخصصات' : `تخصص ${className}`;
  const gradeLabel = gradeLevel === 1 ? 'الأول' : gradeLevel === 2 ? 'الثاني' : 'الثالث';

  return (
    <div className="mb-6">
      {/* Dark title bar */}
      <div className="bg-[#1a2744] text-white text-center py-2 mb-0">
        <h3 className="text-sm font-bold">
          تحليل نتيجة الـ {remedialThreshold}% للصف {gradeLabel} للعام الدراسي 2025 / 2026 {titleSuffix}
        </h3>
      </div>

      <div className="overflow-x-auto border border-black">
        <table className="w-full text-[11px] min-w-[700px] border-collapse">
          <thead>
            {/* Row 1: Merged headers */}
            <tr className="bg-gray-200">
              <th rowSpan={2} className="px-2 py-1 border border-black font-bold">المادة</th>
              <th rowSpan={2} className="px-2 py-1 border border-black font-bold">اجمالي عدد الطلاب</th>
              <th colSpan={2} className="px-2 py-1 border border-black font-bold">اقل من 50% (الراسبون)</th>
              <th colSpan={2} className="px-2 py-1 border border-black font-bold">من 50% الى اقل من 65%</th>
              <th colSpan={2} className="px-2 py-1 border border-black font-bold">من 65% الى اقل من 85%</th>
              <th colSpan={2} className="px-2 py-1 border border-black font-bold">اكثر من 85%</th>
              <th colSpan={2} className="px-2 py-1 border border-black font-bold">اكثر من {remedialThreshold}%</th>
              <th rowSpan={2} className="px-2 py-1 border border-black font-bold">عدد الناجحين</th>
              <th rowSpan={2} className="px-2 py-1 border border-black font-bold">نسبة الناجحين</th>
            </tr>
            {/* Row 2: Sub-headers */}
            <tr className="bg-gray-200">
              <th className="px-1 py-0.5 border border-black font-medium">عدد</th>
              <th className="px-1 py-0.5 border border-black font-medium">النسبة</th>
              <th className="px-1 py-0.5 border border-black font-medium">عدد</th>
              <th className="px-1 py-0.5 border border-black font-medium">النسبة</th>
              <th className="px-1 py-0.5 border border-black font-medium">عدد</th>
              <th className="px-1 py-0.5 border border-black font-medium">النسبة</th>
              <th className="px-1 py-0.5 border border-black font-medium">عدد</th>
              <th className="px-1 py-0.5 border border-black font-medium">النسبة</th>
              <th className="px-1 py-0.5 border border-black font-medium">عدد</th>
              <th className="px-1 py-0.5 border border-black font-medium">النسبة</th>
            </tr>
          </thead>
          <tbody>
            {allBands.map((b, i) => {
              const isTotal = b.subject === 'المجموع';
              return (
                <tr key={i} className={isTotal ? 'bg-gray-100 font-bold' : ''}>
                  <td className="px-2 py-1 border border-black font-bold text-right">{b.subject}</td>
                  <td className="px-2 py-1 border border-black text-center">{b.totalAttended}</td>
                  <td className="px-1 py-1 border border-black text-center">{b.bandLT50}</td>
                  <td className="px-1 py-1 border border-black text-center">{fmtPct(b.totalAttended > 0 ? (b.bandLT50 / b.totalAttended) * 100 : 0)}</td>
                  <td className="px-1 py-1 border border-black text-center">{b.band50to65}</td>
                  <td className="px-1 py-1 border border-black text-center">{fmtPct(b.totalAttended > 0 ? (b.band50to65 / b.totalAttended) * 100 : 0)}</td>
                  <td className="px-1 py-1 border border-black text-center">{b.band65to85}</td>
                  <td className="px-1 py-1 border border-black text-center">{fmtPct(b.totalAttended > 0 ? (b.band65to85 / b.totalAttended) * 100 : 0)}</td>
                  <td className="px-1 py-1 border border-black text-center">{b.bandGT85}</td>
                  <td className="px-1 py-1 border border-black text-center">{fmtPct(b.totalAttended > 0 ? (b.bandGT85 / b.totalAttended) * 100 : 0)}</td>
                  <td className="px-1 py-1 border border-black text-center">{b.bandGE65}</td>
                  <td className="px-1 py-1 border border-black text-center">{fmtPct(b.totalAttended > 0 ? (b.bandGE65 / b.totalAttended) * 100 : 0)}</td>
                  <td className="px-2 py-1 border border-black text-center font-bold">{b.successCount}</td>
                  <td className="px-2 py-1 border border-black text-center font-bold">{fmtPct(b.successRate)}</td>
                </tr>
              );
            })}
            {/* Average row */}
            <tr className="bg-gray-100 font-bold">
              <td className="px-2 py-1 border border-black text-right">{avgRow.subject}</td>
              <td className="px-2 py-1 border border-black text-center">{avgRow.totalAttended}</td>
              <td className="px-1 py-1 border border-black text-center">{avgRow.bandLT50}</td>
              <td className="px-1 py-1 border border-black text-center">{fmtPct(avgRow.totalAttended > 0 ? (avgRow.bandLT50 / avgRow.totalAttended) * 100 : 0)}</td>
              <td className="px-1 py-1 border border-black text-center">{avgRow.band50to65}</td>
              <td className="px-1 py-1 border border-black text-center">{fmtPct(avgRow.totalAttended > 0 ? (avgRow.band50to65 / avgRow.totalAttended) * 100 : 0)}</td>
              <td className="px-1 py-1 border border-black text-center">{avgRow.band65to85}</td>
              <td className="px-1 py-1 border border-black text-center">{fmtPct(avgRow.totalAttended > 0 ? (avgRow.band65to85 / avgRow.totalAttended) * 100 : 0)}</td>
              <td className="px-1 py-1 border border-black text-center">{avgRow.bandGT85}</td>
              <td className="px-1 py-1 border border-black text-center">{fmtPct(avgRow.totalAttended > 0 ? (avgRow.bandGT85 / avgRow.totalAttended) * 100 : 0)}</td>
              <td className="px-1 py-1 border border-black text-center">{avgRow.bandGE65}</td>
              <td className="px-1 py-1 border border-black text-center">{fmtPct(avgRow.totalAttended > 0 ? (avgRow.bandGE65 / avgRow.totalAttended) * 100 : 0)}</td>
              <td className="px-2 py-1 border border-black text-center">{avgRow.successCount}</td>
              <td className="px-2 py-1 border border-black text-center">{fmtPct(avgRow.successRate)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
