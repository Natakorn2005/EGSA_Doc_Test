import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSecretaryRole } from "@/lib/roles";

export async function POST(req: Request) {
  const session = await auth();
  if (!isSecretaryRole(session?.user?.role || null) || !session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { trackingId } = body;

  if (!trackingId) {
    return NextResponse.json({ success: false, error: "Missing trackingId" }, { status: 400 });
  }

  const url = process.env.APPS_SCRIPT_WEB_APP_URL;
  const secret = process.env.APPS_SCRIPT_API_SECRET;
  if (!url || !secret) {
    return NextResponse.json(
      { success: false, error: "Server not configured (missing Apps Script env vars)" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "advanceToWaitingSign",
        secret,
        trackingId,
        // *** เปลี่ยน: ส่งอีเมลที่ล็อกอินจริง แทนชื่อที่เลือกจาก dropdown ***
        // Apps Script จะ resolve ชื่อ+ตำแหน่งที่แท้จริงเองจากแท็บ "เจ้าหน้าที่"
        reviewerEmail: session.user.email,
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