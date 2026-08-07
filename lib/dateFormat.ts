// ตัวช่วยแปลงวันที่จากชีต (รูปแบบ DD/MM/YYYY หรือ DD/MM/YYYY HH:mm:ss) เป็น Date object
// สร้างแยกไว้เพราะ new Date(string) ตีความ "5/8/2026" เป็นเดือน 5 วัน 8 แบบ en-US
// ทั้งที่ชีตจริงบันทึกเป็น วัน/เดือน/ปี (DD/MM/YYYY) ทำให้เดือนสลับกันตอนจัดกลุ่มสรุปรายเดือน

export function parseSheetDate(str: string): Date | null {
  if (!str) return null;

  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const [, d, m, y, h, min, s] = match;
    const date = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      h ? Number(h) : 0,
      min ? Number(min) : 0,
      s ? Number(s) : 0
    );
    if (!isNaN(date.getTime())) return date;
  }

  // fallback: ลอง new Date() เฉย ๆ เผื่อรูปแบบเป็น ISO string อยู่แล้ว
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function getMonthKey(dateStr: string): string {
  const d = parseSheetDate(dateStr);
  if (!d) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
