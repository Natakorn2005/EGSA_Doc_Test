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

export async function getSecretarySheet(): Promise<SheetData> {
  return getSheetValues("ระบบส่งเอกสาร");
}
