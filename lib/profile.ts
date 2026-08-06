import { getSheetValues } from "./googleSheets";

const PROFILE_TAB_NAME = "ผู้ใช้งาน";

export type UserProfile = {
  name: string;
  studentId: string;
  phone: string;
};

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const { headers, rows } = await getSheetValues(PROFILE_TAB_NAME);
  const emailCol = headers.indexOf("อีเมล");
  const nameCol = headers.indexOf("ชื่อ - นามสกุล");
  const studentIdCol = headers.indexOf("รหัสนักศึกษา");
  const phoneCol = headers.indexOf("เบอร์โทรสำหรับติดต่อ");

  if (emailCol === -1) return null;

  const normalized = email.trim().toLowerCase();
  const match = rows.find((r) => (r[emailCol] || "").trim().toLowerCase() === normalized);
  if (!match) return null;

  return {
    name: nameCol === -1 ? "" : match[nameCol] || "",
    studentId: studentIdCol === -1 ? "" : match[studentIdCol] || "",
    phone: phoneCol === -1 ? "" : match[phoneCol] || "",
  };
}