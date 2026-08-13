'use client';

import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Fingerprint, Loader2, Upload } from 'lucide-react';
import {
  normalizeHeader,
  parseDateValue,
  parseTimeValue
} from '@/lib/attendance-parse';

type ImportRow = {
  employee_code: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
};

type ImportResult = {
  imported: number;
  matched: number;
  unmatched: string[];
};

function headerIndexes(headers: string[]) {
  const find = (patterns: string[]) => headers.findIndex((h) => patterns.includes(h));
  return {
    code: find(['employeecode', 'empcode', 'code', 'employee', 'الكود', 'كودالموظف']),
    date: find(['date', 'day', 'التاريخ', 'اليوم']),
    in: find(['checkintime', 'checkin', 'clockin', 'intime', 'وقتالحضور', 'دخول']),
    out: find(['checkouttime', 'checkout', 'clockout', 'outtime', 'وقتالانصراف', 'خروج'])
  };
}

function rowsFromMatrix(matrix: unknown[][]): ImportRow[] {
  const rows = matrix.filter(
    (r) => Array.isArray(r) && r.some((c) => c !== '' && c !== null && c !== undefined)
  );
  if (!rows.length) return [];

  const headerRow = rows[0].map(normalizeHeader);
  const idx = headerIndexes(headerRow);
  const hasHeader = idx.code >= 0 || idx.date >= 0 || idx.in >= 0 || idx.out >= 0;
  const useIdx = hasHeader ? idx : { code: 0, date: 1, in: 2, out: 3 };
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((r) => {
      const get = (i: number) => (i >= 0 && i < r.length ? r[i] : '');
      return {
        employee_code: String(get(useIdx.code) ?? '').trim(),
        date: parseDateValue(get(useIdx.date)) ?? '',
        check_in_time: parseTimeValue(get(useIdx.in)) ?? '',
        check_out_time: parseTimeValue(get(useIdx.out)) ?? ''
      };
    })
    .filter((r) => r.employee_code && r.date);
}

async function parseFile(file: File): Promise<ImportRow[]> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
    return rowsFromMatrix(matrix);
  }
  const text = await file.text();
  const parsed = Papa.parse<unknown[]>(text, { header: false, skipEmptyLines: true });
  const matrix = parsed.data.filter((r) => Array.isArray(r));
  return rowsFromMatrix(matrix);
}

export function FingerprintImport({
  employeeCodes
}: {
  employeeCodes: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [lateThreshold, setLateThreshold] = useState('09:00');

  const codeSet = useMemo(() => new Set(employeeCodes.map((c) => c.toLowerCase())), [employeeCodes]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    try {
      const parsed = await parseFile(file);
      if (!parsed.length) {
        setError('الملف فارغ أو لا يحتوي على أعمدة صحيحة (employee_code, date, check_in_time, check_out_time)');
        setRows(null);
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch (err) {
      console.error('parse failed', err);
      setError('تعذر قراءة الملف. تأكد أنه بصيغة CSV أو Excel صحيحة.');
      setRows(null);
    }
  }

  async function confirmImport() {
    if (!rows?.length) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/attendance/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, lateThreshold })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'حدث خطأ أثناء الاستيراد');
      } else {
        setResult(data);
        setRows(null);
        setFileName('');
        if (fileRef.current) fileRef.current.value = '';
      }
    } catch (err) {
      console.error('import failed', err);
      setError('فشل الاتصال بالخادم أثناء الاستيراد');
    } finally {
      setLoading(false);
    }
  }

  const preview = rows?.slice(0, 20) ?? [];

  return (
    <section className="card p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="font-display">استيراد بيانات البصمة</h2>
        <label className="text-xs text-muted flex items-center gap-2">
          حدّ التأخر (وقت الدخول بعده يُعتبر متأخر)
          <input
            type="time"
            value={lateThreshold}
            onChange={(e) => setLateThreshold(e.target.value)}
            className="input-field w-auto py-1"
          />
        </label>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFile}
        className="input-field mb-3"
      />
      <p className="text-xs text-muted mb-3">
        التنسيق المتوقع: <code className="bg-paper px-1 rounded">employee_code, date, check_in_time, check_out_time</code>
      </p>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1 mb-3">
          <AlertTriangle size={15} /> {error}
        </p>
      )}

      {rows && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-paper px-4 py-2 text-sm flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand" />
              {fileName} — {rows.length} صف
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={confirmImport} disabled={loading} className="btn-primary">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                تأكيد الاستيراد
              </button>
              <button
                type="button"
                onClick={() => {
                  setRows(null);
                  setFileName('');
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">كود الموظف</th>
                  <th className="px-4 py-2 font-medium">التاريخ</th>
                  <th className="px-4 py-2 font-medium">وقت الحضور</th>
                  <th className="px-4 py-2 font-medium">وقت الانصراف</th>
                  <th className="px-4 py-2 font-medium">التطابق</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2 text-muted" dir="ltr">{r.employee_code}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2">{r.check_in_time || '—'}</td>
                    <td className="px-4 py-2">{r.check_out_time || '—'}</td>
                    <td className="px-4 py-2">
                      {codeSet.has(r.employee_code.toLowerCase()) ? (
                        <span className="text-emerald-600 flex items-center gap-1 text-xs">
                          <CheckCircle2 size={14} /> متطابق
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 text-xs">
                          <AlertTriangle size={14} /> غير معروف
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 20 && (
            <p className="px-4 py-2 text-xs text-muted">... وعرض أول 20 صف فقط من {rows.length}</p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm bg-paper rounded-lg p-4">
          <p className="font-medium mb-1">نتيجة الاستيراد</p>
          <ul className="space-y-0.5 text-muted">
            <li>سجلات مستوردة: <b className="text-ink">{result.imported}</b></li>
            <li>موظفون متطابقون: <b className="text-emerald-600">{result.matched}</b></li>
            <li>أكواد غير متطابقة: <b className="text-red-500">{result.unmatched.length}</b></li>
          </ul>
          {result.unmatched.length > 0 && (
            <p className="mt-2 text-xs text-red-600" dir="ltr">
              غير متطابقة: {result.unmatched.join('، ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
