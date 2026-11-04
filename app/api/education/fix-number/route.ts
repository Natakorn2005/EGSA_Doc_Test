import { auth } from "@/auth";
import { isEducationRole } from "@/lib/roles";
import { callAppsScript, jsonError } from "@/lib/appsScriptCall";

/** ทางลัด: การศึกษาแก้เลข สวศ. (ต้องแนบ Word + PDF ใหม่ผ่าน /api/education/attach mode=fix ก่อน) */
export async function POST(req: Request) {
  const session = await auth();
  if (!isEducationRole(session?.user?.role || null) || !session?.user?.email) {
    return jsonError("Unauthorized", 403);
  }
  const body = await req.json();
  const trackingId = String(body.trackingId || "").trim();
  const eduNumber = String(body.eduNumber || "").trim();
  if (!trackingId) return jsonError("Missing trackingId");
  if (!eduNumber) return jsonError("กรุณากรอกเลข สวศ.");
  return callAppsScript("eduFixShortcut", {
    trackingId,
    eduNumber,
    confirmDuplicate: !!body.confirmDuplicate,
    reviewerEmail: session.user.email,
  });
}
