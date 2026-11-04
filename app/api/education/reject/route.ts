import { auth } from "@/auth";
import { isEducationRole } from "@/lib/roles";
import { callAppsScript, fileToPayload, isPdfFile, jsonError, MAX_UPLOAD_BYTES } from "@/lib/appsScriptCall";

/** การศึกษาตีกลับ — เหตุผล (บังคับ) + ไฟล์ที่วงจุดแก้ (ไม่บังคับ) */
export async function POST(req: Request) {
  const session = await auth();
  if (!isEducationRole(session?.user?.role || null) || !session?.user?.email) {
    return jsonError("Unauthorized", 403);
  }

  const formData = await req.formData();
  const trackingId = String(formData.get("trackingId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const file = formData.get("file") as File | null;

  if (!trackingId) return jsonError("Missing trackingId");
  if (!reason) return jsonError("กรุณาระบุเหตุผลที่ตีกลับ");
  if (file && file.size > MAX_UPLOAD_BYTES) return jsonError("ไฟล์ใหญ่เกินไป (จำกัด 3MB)");
  if (file && !isPdfFile(file)) return jsonError("ไฟล์ที่วงจุดแก้ต้องเป็น PDF");

  return callAppsScript("eduReject", {
    trackingId,
    reason,
    reviewerEmail: session.user.email,
    ...(file ? await fileToPayload(file) : {}),
  });
}
