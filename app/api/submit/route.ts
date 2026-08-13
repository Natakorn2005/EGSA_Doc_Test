import { NextResponse } from "next/server";
import { checkSubmitRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const formData = await req.formData();

  // *** Honeypot — ช่องซ่อนที่คนจริงมองไม่เห็นและไม่กรอก แต่บอทที่กรอกทุกช่องจะติดกับ ***
  // ตอบ success ปลอมกลับไป (ไม่บอกว่าจับได้) เพื่อไม่ให้ผู้เขียนบอทรู้ว่าโดนบล็อกเพราะอะไร
  const honeypot = formData.get("website") as string | null;
  if (honeypot && honeypot.trim() !== "") {
    return NextResponse.json({
      success: true,
      data: { trackingId: "TRK-00000000-000", docName: "", applicant: "" },
    });
  }

  const name = formData.get("name") as string;
  const studentId = formData.get("studentId") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const docName = formData.get("docName") as string;
  const agencyType = formData.get("agencyType") as string;
  const agencyValue = formData.get("agencyValue") as string;
  const previousTrackingId = formData.get("previousTrackingId") as string;
  const acknowledged = formData.get("acknowledged") === "true";
  const file = formData.get("file") as File | null;

  // *** Rate limit — กันการยิงรัว ๆ จาก IP เดียวหรืออีเมลเดียว ***
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rate = checkSubmitRateLimit(ip, email || "");
  if (!rate.ok) {
    return NextResponse.json(
      {
        success: false,
        error:
          rate.reason === "email"
            ? "ยื่นเอกสารบ่อยเกินกำหนดสำหรับอีเมลนี้ กรุณาลองใหม่ในวันถัดไป หรือติดต่อเลขาธิการ"
            : "ยื่นเอกสารบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      },
      { status: 429 }
    );
  }

  if (!name || !email || !docName || !agencyType || !agencyValue || !file) {
    return NextResponse.json({ success: false, error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
  }
  if (!acknowledged) {
    return NextResponse.json({ success: false, error: "กรุณายืนยันว่าท่านรับทราบกระบวนการ" }, { status: 400 });
  }
  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "ไฟล์ใหญ่เกินไป (จำกัด 3MB)" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ success: false, error: "รองรับเฉพาะไฟล์ PDF" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const url = process.env.APPS_SCRIPT_WEB_APP_URL;
  const secret = process.env.APPS_SCRIPT_API_SECRET;
  if (!url || !secret) {
    return NextResponse.json({ success: false, error: "Server not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        secret,
        name,
        studentId,
        email,
        phone,
        docName,
        agencyType,
        agencyValue,
        previousTrackingId,
        acknowledged,
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { success: false, error: "Unexpected response from Apps Script: " + raw };
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}