/**
 * ลิงก์ Google Form สำรอง — ใช้ตอนไฟล์ใหญ่เกินกว่าที่เว็บแอปรับได้ (3 MB)
 *
 * เว็บแอปส่งไฟล์ผ่าน Vercel ซึ่งรับได้ไม่เกินราว 4.5 MB ต่อครั้ง (หลังแปลงเป็น base64 แล้ว
 * ไฟล์ 3 MB จะโตเป็นราว 4 MB) แต่ Google Form รับไฟล์ได้ถึง 10 MB และมีสคริปต์รองรับอยู่แล้ว
 * (onSignedFormSubmit / onRejectFormSubmit) ผลลัพธ์จึงเหมือนกดในเว็บแอปทุกอย่าง
 *
 * ลิงก์จะเติมข้อมูลที่กรอกไว้ในหน้าต่างของเว็บแอปให้ด้วย (Tracking ID, เหตุผลตีกลับ, ชื่อผู้ตรวจ/ผู้เซ็น)
 * เหลือแค่แนบไฟล์แล้วกดส่ง
 *
 * ลำดับการหาลิงก์ฐาน:
 *  1) formUrl ด้านล่าง (ถ้าใส่ไว้)
 *  2) ลิงก์ที่ Apps Script เขียนไว้ในแถวนั้นของชีต (คอลัมน์ "ลิงก์อนุมัติ" / "ลิงก์ส่งผลการตรวจสอบ")
 *     แล้วเติมช่องอื่น ๆ ต่อท้ายให้
 *
 * *** ถ้าย้ายบัญชี/สร้างฟอร์มใหม่: formUrl ต้องเป็นลิงก์ docs.google.com/forms/d/e/.../viewform
 *     ห้ามใช้ลิงก์ย่อ forms.gle เพราะจะทิ้งข้อมูลที่เติมไว้ระหว่าง redirect
 *     entry ID ไม่ต้องแก้ ถ้าฟอร์มใหม่ทำด้วยการ "ทำสำเนา" จากฟอร์มเดิม
 *
 * วิธีหา entry ID: เปิดฟอร์มในโหมดแก้ไข > ⋮ > รับลิงก์ที่กรอกไว้ล่วงหน้า (Get pre-filled link)
 * > กรอกทุกช่อง > รับลิงก์ — ในลิงก์จะมี entry.ตัวเลข=ค่าที่กรอก
 * ช่องที่ entry ID ว่าง ("") จะถูกข้าม ไม่เติมให้
 */

type FormConfig = {
  formUrl: string;
  entries: { trackingId: string; reason?: string; person: string };
  // ช่องที่เติมค่าเดิมทุกครั้ง (entry ID -> ค่า)
  fixed?: Record<string, string>;
};

// ฟอร์ม "อัปโหลดเอกสารที่เซ็นแล้ว"
const SIGNED_FORM: FormConfig = {
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdqbBs9JZoS-yhRkyg_jq5W9B6yby4szmk1WtR3FmN0yguVxA/viewform",
  entries: {
    trackingId: "1339106815",
    // ตำแหน่งผู้เซ็นอนุมัติ — ค่าที่เติมมาจาก ROLE_DISPLAY ใน lib/roles.ts (เช่น "นายกสโมสร")
    // ต้องสะกดตรงกับตัวเลือกในฟอร์มทุกตัวอักษร ถ้าแก้ชื่อตำแหน่งที่ใดที่หนึ่ง ต้องแก้อีกที่ด้วย
    person: "1710217122",
  },
};

// ฟอร์ม "แจ้งตีกลับเอกสาร"
const REJECT_FORM: FormConfig = {
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSde0GQV9D69ZuZIbSKnucBd9Dy43sOlCzahQNl8UfmzJbQYcA/viewform",
  entries: {
    trackingId: "1095174600",
    reason: "1323536185", // เหตุผลที่ตีกลับ
    // ตำแหน่งผู้ตรวจสอบ — ค่ามาจาก ROLE_DISPLAY ใน lib/roles.ts ("เลขานุการ" / "รองเลขานุการ")
    // ต้องสะกดตรงกับตัวเลือกในฟอร์มทุกตัวอักษร
    person: "1424387615",
  },
  fixed: {
    "464272886": "ไม่ผ่านการตรวจสอบ", // ผลการตรวจสอบ — ปุ่มนี้ใช้ตอนตีกลับเท่านั้น
  },
};

export type FallbackData = {
  trackingId: string;
  reason?: string; // เฉพาะตีกลับ
  person?: string; // ตำแหน่งของคนที่ล็อกอิน เช่น "เลขานุการ" (ตีกลับ) หรือ "นายกสโมสร" (อนุมัติ)
};

/** คืนลิงก์ฟอร์มสำรองที่เติมข้อมูลไว้แล้ว หรือ "" ถ้าไม่มีลิงก์ฐานเลย */
export function fallbackFormUrl(
  kind: "approve" | "reject",
  data: FallbackData,
  urlFromSheet?: string
): string {
  const cfg = kind === "approve" ? SIGNED_FORM : REJECT_FORM;
  const sheetOk = !!urlFromSheet && /^https:\/\/docs\.google\.com\/forms\//.test(urlFromSheet);
  const base = cfg.formUrl || (sheetOk ? urlFromSheet! : "");
  if (!base) return "";

  const url = new URL(base);
  url.searchParams.set("usp", "pp_url");
  const fill = (entryId: string | undefined, value: string | undefined) => {
    if (entryId && value && value.trim()) url.searchParams.set(`entry.${entryId}`, value.trim());
  };
  fill(cfg.entries.trackingId, data.trackingId);
  fill(cfg.entries.reason, data.reason);
  fill(cfg.entries.person, data.person);
  for (const [entryId, value] of Object.entries(cfg.fixed || {})) fill(entryId, value);
  return url.toString();
}
