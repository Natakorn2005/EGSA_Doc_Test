import { getSheetValues } from "./googleSheets";

const STAFF_TAB_NAME = "เจ้าหน้าที่";

const ROLE_MAP: Record<string, "secretary" | "president"> = {
  "secretary": "secretary",
  "president": "president",
};

export type StaffRole = "secretary" | "president" | null;

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
