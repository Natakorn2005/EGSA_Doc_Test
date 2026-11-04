/**
 * เลข สวศ. — การศึกษาพิมพ์เอง ระบบไม่ได้ออกให้
 * มี 2 ชุด: "สวศ. 123/2569" และ "สวศ. ว123/2569" ตัวเลข 3 หลักเสมอ ปีเป็น พ.ศ. 4 หลัก
 * กติกาต้องตรงกับ normalizeEduNumber_ ใน apps-script/EducationFlow.gs
 */

export const EDU_PREFIX = "สวศ. ";

/** คืนรูปแบบมาตรฐาน "สวศ. ว123/2569" หรือ null ถ้าผิดรูปแบบ (รับได้ทั้งแบบมีและไม่มี "สวศ." นำหน้า) */
export function normalizeEduNumber(raw: string): string | null {
  const s = (raw || "").trim().replace(/^สวศ\.?\s*/, "").replace(/\s+/g, "");
  const m = s.match(/^(ว?)(\d{3})\/(25\d{2})$/);
  if (!m) return null;
  return `${EDU_PREFIX}${m[1]}${m[2]}/${m[3]}`;
}

/** ส่วนหลังของเลข (ไม่มี "สวศ. ") ใช้เติมในช่องกรอก */
export function eduNumberSuffix(full: string): string {
  return (full || "").replace(/^สวศ\.?\s*/, "");
}

export type EduNumberUse = { number: string; trackingId: string; docName: string; status: string };

export type EduNumberCheck =
  | { state: "empty" }
  | { state: "invalid" }
  | { state: "ok"; normalized: string }
  | { state: "usedBefore"; normalized: string; uses: EduNumberUse[] }
  | { state: "inUse"; normalized: string; uses: EduNumberUse[] };

/**
 * เช็ครูปแบบและการซ้ำทันทีที่พิมพ์ (ฝั่ง Apps Script เช็คซ้ำอีกครั้งตอนบันทึกเสมอ)
 * @param excludeIds รหัสที่ไม่นับ — ตัวเอง และรอบก่อนของเรื่องเดียวกัน (เลือก "ใช้เลขเดิม" ไม่ต้องเตือน)
 */
export function checkEduNumber(raw: string, index: EduNumberUse[], excludeIds: string[]): EduNumberCheck {
  if (!raw.trim()) return { state: "empty" };
  const normalized = normalizeEduNumber(raw);
  if (!normalized) return { state: "invalid" };
  const uses = index.filter((u) => u.number === normalized && !excludeIds.includes(u.trackingId));
  const inUse = uses.filter((u) => u.status !== "ตีกลับ");
  if (inUse.length) return { state: "inUse", normalized, uses: inUse };
  if (uses.length) return { state: "usedBefore", normalized, uses };
  return { state: "ok", normalized };
}

/** เลขสูงสุดของแต่ละชุด (ปีล่าสุดก่อน แล้วเลขมากสุด) ใช้บอกการศึกษาประกอบการกรอก */
export function latestEduNumbers(index: EduNumberUse[]): { plain: string | null; wor: string | null } {
  const best: { plain: [number, string] | null; wor: [number, string] | null } = { plain: null, wor: null };
  for (const u of index) {
    const m = u.number.match(/^สวศ\. (ว?)(\d{3})\/(\d{4})$/);
    if (!m) continue;
    const score = Number(m[3]) * 1000 + Number(m[2]);
    const key = m[1] ? "wor" : "plain";
    const cur = best[key];
    if (!cur || score > cur[0]) best[key] = [score, u.number];
  }
  return { plain: best.plain?.[1] ?? null, wor: best.wor?.[1] ?? null };
}
