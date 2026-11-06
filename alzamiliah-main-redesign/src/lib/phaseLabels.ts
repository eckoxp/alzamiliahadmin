/* Labels for the public timeline (pure code: used by the project page and the phase page) */

const norm = (s: string) =>
  s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

// the column names a ColorIdea report really has. Any other name is shown exactly as it is stored.
const EN: Record<string, string> = {
  'الاجمالي الفعلي': 'Overall progress',
  'التصميم': 'Design',
  'اعمال تجهيز الموقع': 'Site preparation',
  'اوامر الشراء والعقود': 'Purchase orders & contracts',
  'اعمال العظم': 'Structural works',
  'التشطيبات': 'Finishing',
  'اعمال الكتروميكانيك': 'Electromechanical works',
  'ملاحظات': 'Notes',
  'قراءه الانجاز': 'Progress reading',
  'المراحل القادمه المتوقعه': 'Expected upcoming phases',
};

export function metricLabel(name: string, isRTL: boolean): string {
  if (isRTL) return name;
  return EN[norm(name)] ?? name;
}

/** "2026-10" -> "أكتوبر 2026" / "October 2026" (digits are always 0-9) */
export function monthLabel(month: string, isRTL: boolean): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return new Intl.DateTimeFormat(isRTL ? 'ar-EG-u-nu-latn' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}