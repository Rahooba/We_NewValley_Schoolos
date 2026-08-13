'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export function StudentPicker({
  students,
  name
}: {
  students: { id: string; fullName: string; className?: string; studentCode?: string }[];
  name: string;
}) {
  const [query, setQuery] = useState('');
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const list = useMemo(
    () =>
      students.filter(
        (s) =>
          s.fullName.includes(query) ||
          (s.className ?? '').includes(query) ||
          (s.studentCode ?? '').includes(query)
      ),
    [students, query]
  );

  const selected = students.find((s) => s.id === value);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} required />
      <div
        className="input-field flex items-center gap-2 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <Search size={14} className="text-muted shrink-0" />
        <span className={value ? '' : 'text-muted'}>{selected ? selected.fullName : 'ابحث عن طالب...'}</span>
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-sm shadow-lg max-h-48 overflow-auto">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            className="w-full px-3 py-2 text-sm border-b border-border outline-none"
          />
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setValue(s.id);
                setOpen(false);
                setQuery('');
              }}
              className="block w-full text-right px-3 py-2 text-sm hover:bg-paper"
            >
              {s.fullName}
              <span className="text-muted text-xs"> — {s.className || 'بدون فصل'}</span>
            </button>
          ))}
          {list.length === 0 && <p className="px-3 py-2 text-sm text-muted">لا نتائج</p>}
        </div>
      )}
    </div>
  );
}
