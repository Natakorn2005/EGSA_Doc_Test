import { auth } from "@/auth";
import { callAppsScript, fileToPayload, isPdfFile, jsonError, MAX_UPLOAD_BYTES } from "@/lib/appsScriptCall";

/**
 * ผู้ยื่นอัปโหลดฉบับที่ประธานโครงการและอาจารย์เซ็นแล้ว ในเอกสารเดิม
 * Apps Script เทียบอีเมลที่ล็อกอินกับอีเมลที่ใช้ยื่น และไม่รับไฟล์ที่เหมือน PDF จากการศึกษาทุกไบต์
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return jsonError("กรุณาเข้าสู่ระบบก่อนอัปโหลด", 401);

  const formData = await req.formData();
  const trackingId = String(formData.get("trackingId") || "").trim();
  // ตีกลับแบบเล็ก: ส่งฉบับเซ็นใหม่เป็นรอบใหม่ของเอกสารที่ถูกตีกลับ
  const resubmitOf = String(formData.get("resubmitOf") || "").trim();
  const file = formData.get("file") as File | null;

  if (!trackingId && !resubmitOf) return jsonError("Missing trackingId");
  if (!file) return jsonError("กรุณาแนบไฟล์ PDF ที่เซ็นแล้ว");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("ไฟล์ใหญ่เกินไป (จำกัด 3MB)");
  if (!isPdfFile(file)) return jsonError("ฉบับที่เซ็นแล้วต้องเป็นไฟล์ PDF");

  if (resubmitOf) {
    return callAppsScript("resubmitSigned", {
      previousTrackingId: resubmitOf,
      userEmail: session.user.email,
      ...(await fileToPayload(file)),
    });
  }

  return callAppsScript("uploadSigned", {
    trackingId,
    userEmail: session.user.email,
    ...(await fileToPayload(file)),
  });
}
