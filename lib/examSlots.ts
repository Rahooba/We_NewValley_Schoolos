export type SlotDef = {
  key: string;
  label: string;
  group: 'formative' | 'specialization' | 'culture';
};

export const GRADE_LABELS: Record<number, string> = {
  1: 'الصف الأول',
  2: 'الصف الثاني',
  3: 'الصف الثالث'
};

// التكويني لصف أول (4 تقييمات)، ولصفين الثاني والثالث (4 تخصص + 4 ثقافي شامل)
export const SLOTS_BY_LEVEL: Record<number, SlotDef[]> = {
  1: ([1, 2, 3, 4].map((n) => ({ key: `formative${n}`, label: `تكويني ${n}`, group: 'formative' })) as SlotDef[]),
  2: [
    ...[1, 2, 3, 4].map((n) => ({ key: `specialization${n}`, label: `تخصص ${n}`, group: 'specialization' })),
    ...[1, 2, 3, 4].map((n) => ({ key: `culture${n}`, label: `ثقافي شامل ${n}`, group: 'culture' }))
  ] as SlotDef[],
  3: [
    ...[1, 2, 3, 4].map((n) => ({ key: `specialization${n}`, label: `تخصص ${n}`, group: 'specialization' })),
    ...[1, 2, 3, 4].map((n) => ({ key: `culture${n}`, label: `ثقافي شامل ${n}`, group: 'culture' }))
  ] as SlotDef[]
};

export function slotLabel(key: string): string {
  for (const level of Object.keys(SLOTS_BY_LEVEL)) {
    const found = SLOTS_BY_LEVEL[Number(level)].find((s) => s.key === key);
    if (found) return found.label;
  }
  return key;
}

export const GROUP_LABELS: Record<SlotDef['group'], string> = {
  formative: 'التقييمات التكوينية',
  specialization: 'تقييمات التخصص',
  culture: 'الثقافي الشامل'
};

export const MAX_SLOT_SCORE = 100;

export const FIXED_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الفيزياء',
  'الرياضيات',
  'دراسات اجتماعية',
  'المواد الفنية التخصصية النظرية',
  'المواد الفنية التخصصية العملية',
  'الاقتصاد',
  'التدريب الميداني',
  'التربية الدينية'
] as const;