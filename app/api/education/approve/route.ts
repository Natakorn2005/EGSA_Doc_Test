import { auth } from "@/auth";
import { isEducationRole } from "@/lib/roles";
import { callAppsScript, jsonError } from "@/lib/appsScriptCall";

/** การศึกษากดส่งคืนผู้ยื่น — ใส่เลข สวศ. (ต้องแนบ Word และ PDF ผ่าน /api/education/attach ก่อน) */
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

  return callAppsScript("eduApprove", {
    trackingId,
    eduNumber,
    confirmDuplicate: !!body.confirmDuplicate,
    reviewerEmail: session.user.email,
  });
}
