import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSecretaryRole } from "@/lib/roles";

export async function POST(req: Request) {
  const session = await auth();
  if (!isSecretaryRole(session?.user?.role || null)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { trackingId, reviewerName } = body;

  if (!trackingId || !reviewerName) {
    return NextResponse.json(
      { success: false, error: "Missing trackingId or reviewerName" },
      { status: 400 }
    );
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
        reviewerName,
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