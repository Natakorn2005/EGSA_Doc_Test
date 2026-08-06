import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const studentId = String(body.studentId || "").trim();
  const phone = String(body.phone || "").trim();

  if (!name) {
    return NextResponse.json({ success: false, error: "กรุณากรอกชื่อ - นามสกุล" }, { status: 400 });
  }

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
        action: "saveProfile",
        secret,
        // อีเมลบังคับมาจาก session เท่านั้น ป้องกันการแก้โปรไฟล์คนอื่นผ่าน API ตรงๆ
        email: session.user.email,
        name,
        studentId,
        phone,
      }),
    });
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { success: false, error: "Unexpected response from Apps Script: " + raw.slice(0, 200) };
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}