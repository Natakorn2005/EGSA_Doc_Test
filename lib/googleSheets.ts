import { google } from "googleapis";

function getCredentials() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64) throw new Error("Missing env var GOOGLE_SERVICE_ACCOUNT_KEY_BASE64");
  return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export type SheetData = { headers: string[]; rows: string[][] };

export async function getSheetValues(tabName: string): Promise<SheetData> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing env var GOOGLE_SHEET_ID");

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: tabName,
  });

  const values = res.data.values ?? [];
  if (values.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h ?? ""));
  const rows = dataRows.map((row) => {
    const r = row.map((c) => String(c ?? ""));
    while (r.length < headers.length) r.push("");
    return r;
  });

  return { headers, rows };
}

// *** คอลัมน์ในแท็บ "ระบบส่งเอกสาร" ที่ถูกเขียนเป็นสูตร =HYPERLINK(url,label) ***
// อ่านผ่าน values.get() แบบปกติ (FORMATTED_VALUE) จะได้ "label" กลับมา ไม่ใช่ URL จริง
// ต้อง fetch อีกรอบด้วย valueRenderOption: 'FORMULA' เฉพาะคอลัมน์เหล่านี้ แล้วดึง URL ออกมาเอง
const HYPERLINK_COLUMNS = [
  "เอกสารที่ต้องการยื่น",
  "ลิงก์ไฟล์วงแดง",
  "ลิงก์ฟอร์มส่งเอกสารแก้",
  "เอกสารเซ็นอนุมัติแล้ว",
  "ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)",
];

/**
 * ดึง URL จริงออกจากสูตร =HYPERLINK("url","label")
 * ถ้าไม่ใช่สูตร (เช่น แถวเก่าที่ยังเป็น URL ดิบ หรือข้อความสถานะอย่าง "ตรวจสอบแล้ว") คืนค่าเดิมกลับไป
 */
function extractHyperlinkUrl_(formulaOrValue: string): string {
  if (!formulaOrValue) return "";
  const match = formulaOrValue.match(/^=HYPERLINK\(\s*"([^"]*)"/i);
  return match ? match[1] : formulaOrValue;
}

export async function getSecretarySheet(): Promise<SheetData> {
  const data = await getSheetValues("ระบบส่งเอกสาร");

  const hyperlinkColIndexes = HYPERLINK_COLUMNS
    .map((name) => data.headers.indexOf(name))
    .filter((idx) => idx !== -1);

  if (hyperlinkColIndexes.length === 0) return data;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing env var GOOGLE_SHEET_ID");

  const sheets = await getSheetsClient();
  const formulaRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "ระบบส่งเอกสาร",
    valueRenderOption: "FORMULA",
  });

  const formulaValues = formulaRes.data.values ?? [];
  const [, ...formulaDataRows] = formulaValues; // ข้ามแถวหัวตาราง

  const fixedRows = data.rows.map((row, rowIdx) => {
    const formulaRow = formulaDataRows[rowIdx] || [];
    const newRow = [...row];
    for (const colIdx of hyperlinkColIndexes) {
      const rawFormula = String(formulaRow[colIdx] ?? "");
      if (rawFormula) {
        newRow[colIdx] = extractHyperlinkUrl_(rawFormula);
      }
    }
    return newRow;
  });

  return { headers: data.headers, rows: fixedRows };
}