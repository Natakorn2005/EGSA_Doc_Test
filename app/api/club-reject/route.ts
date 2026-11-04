import { auth } from "@/auth";
import { isSecretaryRole, isSignerRole } from "@/lib/roles";
import { callAppsScript, fileToPayload, isPdfFile, jsonError, MAX_UPLOAD_BYTES } from "@/lib/appsScriptCall";

/**
 * เลขาฯ (เอกสารรอตรวจสอบ) หรือนายกฯ (เอกสารรอเซ็น) ตีกลับแบบเล็ก / ใหญ่
 * Apps Script ตรวจบทบาทกับสถานะเอกสารอีกครั้งเสมอ
 */
export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role || null;
  if ((!isSecretaryRole(role) && !isSignerRole(role)) || !session?.user?.email) {
    return jsonError("Unauthorized", 403);
  }

  const formData = await req.formData();
  const trackingId = String(formData.get("trackingId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const rejectType = String(formData.get("rejectType") || "");
  const file = formData.get("file") as File | null;

  if (!trackingId) return jsonError("Missing trackingId");
  if (!reason) return jsonError("กรุณาระบุเหตุผลที่ตีกลับ");
  if (rejectType !== "small" && rejectType !== "big") return jsonError("กรุณาเลือกแบบการตีกลับ");
  if (file && file.size > MAX_UPLOAD_BYTES) return jsonError("ไฟล์ใหญ่เกินไป (จำกัด 3MB)");
  if (file && !isPdfFile(file)) return jsonError("ไฟล์ที่วงจุดแก้ต้องเป็น PDF");

  return callAppsScript("clubReject", {
    trackingId,
    reason,
    rejectType,
    reviewerEmail: session.user.email,
    ...(file ? await fileToPayload(file) : {}),
  });
}
