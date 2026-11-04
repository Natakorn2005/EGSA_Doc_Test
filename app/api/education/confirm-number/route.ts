import { auth } from "@/auth";
import { isEducationRole } from "@/lib/roles";
import { callAppsScript, jsonError } from "@/lib/appsScriptCall";

/** ทางลัด: การศึกษายืนยันว่าเลข สวศ. ที่ผู้ยื่นกรอกถูกต้อง */
export async function POST(req: Request) {
  const session = await auth();
  if (!isEducationRole(session?.user?.role || null) || !session?.user?.email) {
    return jsonError("Unauthorized", 403);
  }
  const body = await req.json();
  const trackingId = String(body.trackingId || "").trim();
  if (!trackingId) return jsonError("Missing trackingId");
  return callAppsScript("eduConfirmShortcut", { trackingId, reviewerEmail: session.user.email });
}
