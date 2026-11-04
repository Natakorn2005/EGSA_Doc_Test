import { NextResponse } from "next/server";
import { parseAppsScriptResponse } from "@/lib/appsScript";

/** ขนาดไฟล์สูงสุดที่รับผ่านเว็บ (เว็บรับคำขอได้ราว 4.5 MB ต่อครั้ง ไฟล์ใหญ่กว่านี้ใช้ Google Form) */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export const WORD_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function isWordFile(file: File): boolean {
  return WORD_MIME_TYPES.includes(file.type) || /\.(docx?|DOCX?)$/.test(file.name);
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function fileToPayload(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  return { fileBase64: buf.toString("base64"), fileName: file.name, mimeType: file.type || "" };
}

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/** เรียก action ใน Apps Script (WebAppApi.gs) พร้อมรหัสลับ แล้วส่งคำตอบต่อให้หน้าเว็บ */
export async function callAppsScript(action: string, payload: Record<string, unknown>) {
  const url = process.env.APPS_SCRIPT_WEB_APP_URL;
  const secret = process.env.APPS_SCRIPT_API_SECRET;
  if (!url || !secret) return jsonError("Server not configured (missing Apps Script env vars)", 500);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, secret, ...payload }),
    });
    return NextResponse.json(parseAppsScriptResponse(await res.text()));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
}
