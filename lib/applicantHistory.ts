import { getSecretarySheet } from "./googleSheets";

export type ApplicantInfo = {
  name: string;
  studentId: string;
  phone: string;
};

/**
 * หาข้อมูลผู้ยื่นจากการยื่นครั้งล่าสุดที่ตรงกับอีเมลนี้ — ใช้เติมฟอร์มยื่นเอกสารอัตโนมัติ
 * เมื่อผู้ใช้ล็อกอินอยู่ (ไม่บังคับล็อกอินเพื่อยื่น แค่ใช้ auto-fill ถ้ามี session)
 * ถือว่าแถวล่างสุดที่ตรงกันคือครั้งล่าสุด เพราะชีตเรียงตามลำดับเวลาที่ยื่นเสมอ (append-only)
 */
export async function getLatestApplicantInfo(email: string): Promise<ApplicantInfo | null> {
  const { headers, rows } = await getSecretarySheet();
  const emailCol = headers.indexOf("อีเมล");
  const nameCol = headers.indexOf("ชื่อ - นามสกุล");
  const studentIdCol = headers.indexOf("รหัสนักศึกษา");
  const phoneCol = headers.indexOf("เบอร์โทรสำหรับติดต่อ");

  if (emailCol === -1) return null;

  const normalized = email.trim().toLowerCase();
  const matches = rows.filter((r) => (r[emailCol] || "").trim().toLowerCase() === normalized);
  if (matches.length === 0) return null;

  const latest = matches[matches.length - 1];
  return {
    name: nameCol === -1 ? "" : latest[nameCol] || "",
    studentId: studentIdCol === -1 ? "" : latest[studentIdCol] || "",
    phone: phoneCol === -1 ? "" : latest[phoneCol] || "",
  };
}