import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseDateValue, parseTimeValue, toMinutes } from '@/lib/attendance-parse';
import type { AttendanceStatus } from '@/generated/prisma/client';

const DEFAULT_LATE_THRESHOLD_MIN = 9 * 60; // 09:00

export async function POST(req: Request) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('attendance.employees.manage')) {
    return NextResponse.json({ error: 'ليس لديك صلاحية استيراد الحضور' }, { status: 403 });
  }

  let body: { rows?: unknown[]; lateThreshold?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }
  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'لا توجد بيانات للاستيراد' }, { status: 400 });
  }

  const thresholdMatch = /^(\d{1,2}):(\d{2})$/.exec(String(body.lateThreshold ?? ''));
  const lateThresholdMin = thresholdMatch
    ? parseInt(thresholdMatch[1], 10) * 60 + parseInt(thresholdMatch[2], 10)
    : DEFAULT_LATE_THRESHOLD_MIN;

  const employees = await prisma.employee.findMany({ select: { id: true, employeeCode: true } });
  const byCode = new Map(employees.map((e) => [e.employeeCode.trim().toLowerCase(), e.id]));

  let matched = 0;
  let unmatched = 0;
  const unmatchedCodes = new Set<string>();
  const ops = new Map<string, { date: Date; status: AttendanceStatus; checkIn: Date | null; checkOut: Date | null }>();

  for (const row of body.rows) {
    const r = (row ?? {}) as Record<string, unknown>;
    const code = String(r.employee_code ?? r.employeeCode ?? '').trim();
    if (!code) continue;

    const date = parseDateValue(r.date);
    if (!date) {
      unmatched++;
      unmatchedCodes.add(`${code} (تاريخ غير صالح)`);
      continue;
    }

    const employeeId = byCode.get(code.toLowerCase());
    if (!employeeId) {
      unmatched++;
      unmatchedCodes.add(code);
      continue;
    }

    const checkIn = parseTimeValue(r.check_in_time ?? r.checkIn);
    const checkOut = parseTimeValue(r.check_out_time ?? r.checkOut);

    let status: AttendanceStatus;
    if (!checkIn && !checkOut) status = 'ABSENT';
    else if (checkIn && toMinutes(checkIn) > lateThresholdMin) status = 'LATE';
    else status = 'PRESENT';

    const d = new Date(`${date}T00:00:00`);
    const key = `${employeeId}|${d.getTime()}`;
    if (!ops.has(key)) matched++;

    ops.set(key, {
      date: d,
      status,
      checkIn: checkIn ? new Date(`${date}T${checkIn}:00`) : null,
      checkOut: checkOut ? new Date(`${date}T${checkOut}:00`) : null
    });
  }

  for (const [key, op] of ops) {
    const [employeeId, _t] = key.split('|');
    await prisma.employeeAttendance.upsert({
      where: { employeeId_date: { employeeId, date: op.date } },
      update: { status: op.status, checkIn: op.checkIn, checkOut: op.checkOut },
      create: { employeeId, date: op.date, status: op.status, checkIn: op.checkIn, checkOut: op.checkOut }
    });
  }

  return NextResponse.json({
    imported: ops.size,
    matched,
    unmatched,
    unmatchedCodes: [...unmatchedCodes]
  });
}
