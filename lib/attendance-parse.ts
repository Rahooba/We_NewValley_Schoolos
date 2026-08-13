// Shared pure helpers for parsing fingerprint import files (CSV / Excel).
// No browser-only libs here so the same code is safe on client and server.

const pad = (n: number) => String(n).padStart(2, '0');

export function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .toLowerCase()
    .replace(/[\s_\-.]/g, '')
    .trim();
}

export function excelSerialToDate(serial: number): string {
  const days = Math.floor(serial);
  const msInDay = Math.round((serial - days) * 86400000);
  const d = new Date(Date.UTC(1899, 11, 30) + days * 86400000 + msInDay);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseDateValue(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  if (typeof v === 'number' && Number.isFinite(v) && v > 20000 && v < 80000) {
    return excelSerialToDate(v);
  }
  const s = String(v).trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(+iso[2])}-${pad(+iso[3])}`;

  const us = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (us) return `${us[3]}-${pad(+us[1])}-${pad(+us[2])}`;

  return null;
}

export function parseTimeValue(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    const totalMin = Math.round((v - Math.floor(v)) * 1440);
    return `${pad(Math.floor(totalMin / 60) % 24)}:${pad(totalMin % 60)}`;
  }
  const s = String(v).trim();
  if (!s) return null;

  const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|ص|م)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  const ap = (m[4] ?? '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Excel serial number -> "HH:MM" (fractional day)
export function excelSerialToTime(serial: number): string | null {
  const totalMin = Math.round((serial - Math.floor(serial)) * 1440);
  if (totalMin > 1439) return null;
  return `${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}`;
}
