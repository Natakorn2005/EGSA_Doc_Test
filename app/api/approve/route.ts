import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "president") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const trackingId = formData.get("trackingId") as string;
  const approverName = formData.get("approverName") as string;
  const file = formData.get("file") as File | null;

  if (!trackingId || !file) {
    return NextResponse.json({ success: false, error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
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
        action: "approve",
        secret,
        trackingId,
        approverName,
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