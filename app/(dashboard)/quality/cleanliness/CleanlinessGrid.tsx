'use client';

import { CleanlinessCell } from './CleanlinessCell';

export function CleanlinessGrid({
  weeks,
  classes,
  values,
  canManage
}: {
  weeks: { mondayISO: string; label: string; rangeLabel: string }[];
  classes: string[];
  values: Record<string, Record<string, number>>;
  canManage: boolean;
}) {
  const avgOf = (rows: number[]) =>
    rows.length ? rows.reduce((s, v) => s + v, 0) / rows.length : null;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-paper text-muted text-right">
          <tr>
            <th className="px-3 py-2 font-medium">الأسبوع</th>
            {classes.map((c) => (
              <th key={c} className="px-3 py-2 font-medium text-center">
                {c}
              </th>
            ))}
            <th className="px-3 py-2 font-medium text-center">متوسط الأسبوع</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => {
            const weekValues = classes
              .map((c) => values[w.mondayISO]?.[c])
              .filter((v): v is number => typeof v === 'number');
            const avg = avgOf(weekValues);
            return (
              <tr key={w.mondayISO} className="border-t border-border">
                <td className="px-3 py-2">
                  <b>{w.label}</b>
                  <span className="text-xs text-muted block">{w.rangeLabel}</span>
                </td>
                {classes.map((c) => (
                  <td key={c} className="px-2 py-2 text-center">
                    <CleanlinessCell
                      weekDate={w.mondayISO}
                      className={c}
                      value={values[w.mondayISO]?.[c]}
                      canManage={canManage}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-medium">
                  {avg === null ? '—' : `${avg.toFixed(1)}/10`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-paper font-medium">
            <td className="px-3 py-2">متوسط الفصل</td>
            {classes.map((c) => {
              const vals = weeks
                .map((w) => values[w.mondayISO]?.[c])
                .filter((v): v is number => typeof v === 'number');
              const avg = avgOf(vals);
              return (
                <td key={c} className="px-3 py-2 text-center">
                  {avg === null ? '—' : `${avg.toFixed(1)}/10`}
                </td>
              );
            })}
            <td className="px-3 py-2 text-center">—</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
