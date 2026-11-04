import { auth } from "@/auth";
import { isEducationRole } from "@/lib/roles";
import { callAppsScript, fileToPayload, isPdfFile, isWordFile, jsonError, MAX_UPLOAD_BYTES } from "@/lib/appsScriptCall";

/** การศึกษาแนบไฟล์ที่ลงเลขแล้ว ทีละไฟล์ (kind = word | pdf) — ยังไม่เปลี่ยนสถานะ */
export async function POST(req: Request) {
  const session = await auth();
  if (!isEducationRole(session?.user?.role || null) || !session?.user?.email) {
    return jsonError("Unauthorized", 403);
  }

  const formData = await req.formData();
  const trackingId = String(formData.get("trackingId") || "").trim();
  const kind = String(formData.get("kind") || "");
  const file = formData.get("file") as File | null;

  if (!trackingId) return jsonError("Missing trackingId");
  if (kind !== "word" && kind !== "pdf") return jsonError("Invalid kind");
  if (!file) return jsonError("กรุณาแนบไฟล์");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("ไฟล์ใหญ่เกินไป (จำกัด 3MB)");
  if (kind === "word" && !isWordFile(file)) return jsonError("ไฟล์ Word ต้องเป็น .docx หรือ .doc");
  if (kind === "pdf" && !isPdfFile(file)) return jsonError("ไฟล์ PDF ต้องเป็น .pdf");

  return callAppsScript("eduAttach", {
    trackingId,
    kind,
    reviewerEmail: session.user.email,
    ...(await fileToPayload(file)),
  });
}
