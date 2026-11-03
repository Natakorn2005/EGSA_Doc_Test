/**
 * ตัวช่วยอ่านคำตอบจาก Apps Script
 *
 * ปกติ Apps Script จะตอบกลับมาเป็น JSON แต่ถ้าสคริปต์เกิด error
 * หรือ doPost คืนค่าผิดชนิด (เช่น คืน Promise เพราะเผลอใส่ async)
 * Google จะส่ง "หน้าเว็บแจ้งข้อผิดพลาด" เป็น HTML กลับมาแทน
 *
 * ของเดิมเราตัดข้อความเหลือ 200 ตัวอักษรแรก ซึ่งได้แต่หัว HTML
 * (<!DOCTYPE html> ... ppConfig ...) ไม่เห็นสาเหตุจริงที่อยู่ลึกลงไป
 * ไฟล์นี้จึงถอดแท็ก HTML ออกให้เหลือแต่ข้อความ แล้วส่งต่อให้หน้าเว็บแสดง
 */

export type AppsScriptResult = {
  success: boolean;
  error?: string;
  data?: unknown;
  [key: string]: unknown;
};

/** ถอดแท็ก HTML ออก เหลือเฉพาะข้อความที่คนอ่านรู้เรื่อง */
export function extractHtmlMessage(raw: string): string {
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return (text || raw).slice(0, 600);
}

/** แปลงคำตอบดิบจาก Apps Script เป็นผลลัพธ์ที่หน้าเว็บใช้ได้ */
export function parseAppsScriptResponse(raw: string): AppsScriptResult {
  try {
    return JSON.parse(raw) as AppsScriptResult;
  } catch {
    return {
      success: false,
      error: "Apps Script ไม่ได้ตอบกลับเป็น JSON — " + extractHtmlMessage(raw),
    };
  }
}
