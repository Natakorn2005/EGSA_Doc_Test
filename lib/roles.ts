import { getSheetValues } from "./googleSheets";

const STAFF_TAB_NAME = "เจ้าหน้าที่";

export type StaffRole = "secretary" | "vice_secretary" | "president" | "vp_internal" | "vp_external" | null;

const ROLE_MAP: Record<string, Exclude<StaffRole, null>> = {
  "secretary": "secretary",
  "vice_secretary": "vice_secretary",
  "president": "president",
  "vp_internal": "vp_internal",
  "vp_external": "vp_external",
};

const ROLE_DISPLAY: Record<string, string> = {
  secretary: "เลขาธิการ",
  vice_secretary: "รองเลขาธิการ",
  president: "นายกสโมสรฯ",
  vp_internal: "อุปนายกฝ่ายกิจการภายใน",
  vp_external: "อุปนายกฝ่ายกิจการภายนอก",
};

// *** ทุกบทบาทที่ตรวจสอบเอกสารในคิว "รอตรวจสอบ" ได้ — เลขาธิการและรองเลขาธิการ ***
const SECRETARY_ROLES: Exclude<StaffRole, null>[] = ["secretary", "vice_secretary"];

// *** ทุกบทบาทที่มีสิทธิ์เซ็นอนุมัติเอกสารได้ — นายกฯ และรองประธานทั้งสอง (กรณีฉุกเฉิน) ***
const SIGNER_ROLES: Exclude<StaffRole, null>[] = ["president", "vp_internal", "vp_external"];

export async function getStaffRole(email: string): Promise<StaffRole> {
  const { headers, rows } = await getSheetValues(STAFF_TAB_NAME);
  const emailCol = headers.indexOf("อีเมล");
  const roleCol = headers.indexOf("บทบาท");
  if (emailCol === -1 || roleCol === -1) return null;

  const normalized = email.trim().toLowerCase();
  const match = rows.find(
    (r) => (r[emailCol] || "").trim().toLowerCase() === normalized
  );
  if (!match) return null;

  return ROLE_MAP[(match[roleCol] || "").trim()] ?? null;
}

export async function getStaffNamesByRole(role: Exclude<StaffRole, null>): Promise<string[]> {
  const { headers, rows } = await getSheetValues(STAFF_TAB_NAME);
  const nameCol = headers.indexOf("ชื่อ");
  const roleCol = headers.indexOf("บทบาท");
  if (nameCol === -1 || roleCol === -1) return [];

  return rows
    .filter((r) => (r[roleCol] || "").trim() === role)
    .map((r) => (r[nameCol] || "").trim())
    .filter(Boolean);
}

export type SignerOption = { name: string; roleLabel: string };

// *** dropdown สำหรับ /president — รวมนายกฯ + รองประธานทั้งสอง พร้อมตำแหน่งกำกับ ***
export async function getSignerOptions(): Promise<SignerOption[]> {
  const { headers, rows } = await getSheetValues(STAFF_TAB_NAME);
  const nameCol = headers.indexOf("ชื่อ");
  const roleCol = headers.indexOf("บทบาท");
  if (nameCol === -1 || roleCol === -1) return [];

  return rows
    .filter((r) => SIGNER_ROLES.includes((r[roleCol] || "").trim() as Exclude<StaffRole, null>))
    .map((r) => ({
      name: (r[nameCol] || "").trim(),
      roleLabel: ROLE_DISPLAY[(r[roleCol] || "").trim()] || "",
    }))
    .filter((o) => o.name);
}

// *** dropdown สำหรับ /secretary — รวมเลขาธิการ + รองเลขาธิการ พร้อมตำแหน่งกำกับ ***
export async function getReviewerOptions(): Promise<SignerOption[]> {
  const { headers, rows } = await getSheetValues(STAFF_TAB_NAME);
  const nameCol = headers.indexOf("ชื่อ");
  const roleCol = headers.indexOf("บทบาท");
  if (nameCol === -1 || roleCol === -1) return [];

  return rows
    .filter((r) => SECRETARY_ROLES.includes((r[roleCol] || "").trim() as Exclude<StaffRole, null>))
    .map((r) => ({
      name: (r[nameCol] || "").trim(),
      roleLabel: ROLE_DISPLAY[(r[roleCol] || "").trim()] || "",
    }))
    .filter((o) => o.name);
}

export function isSignerRole(role: StaffRole): boolean {
  return !!role && SIGNER_ROLES.includes(role as Exclude<StaffRole, null>);
}

export function isSecretaryRole(role: StaffRole): boolean {
  return !!role && SECRETARY_ROLES.includes(role as Exclude<StaffRole, null>);
}

// *** ป้ายแสดงตำแหน่งสำหรับหน้าแรก — role ว่าง (นักศึกษาทั่วไป) ก็ยังได้ป้ายที่อ่านได้ ***
export function getRoleDisplayLabel(role: StaffRole): string {
  if (!role) return "นักศึกษา";
  return ROLE_DISPLAY[role] || "นักศึกษา";
}

// *** แปลง role -> key สำหรับ next-intl ***
export function getRoleI18nKey(role: StaffRole): string {
  if (role === "secretary") return "secretary";
  if (role === "vice_secretary") return "viceSecretary";
  if (role === "president") return "president";
  if (role === "vp_internal") return "vpInternal";
  if (role === "vp_external") return "vpExternal";
  return "student";
}