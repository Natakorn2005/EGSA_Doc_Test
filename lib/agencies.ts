import { getSheetValues } from "./googleSheets";

const AGENCY_LIST_TAB = "รายชื่อหน่วยงาน";

export type AgencyOptions = {
  "ฝ่ายภายในสโมสร": string[];
  "ชมรม": string[];
  "ภาควิชา": string[];
};

export async function getAgencyOptions(): Promise<AgencyOptions> {
  const { headers, rows } = await getSheetValues(AGENCY_LIST_TAB);

  function readColumn(colName: string): string[] {
    const idx = headers.indexOf(colName);
    if (idx === -1) return [];
    return rows
      .map((r) => (r[idx] || "").trim())
      .filter(Boolean);
  }

  return {
    "ฝ่ายภายในสโมสร": readColumn("ฝ่ายภายในสโมสร"),
    "ชมรม": readColumn("ชมรม"),
    "ภาควิชา": readColumn("ภาควิชา"),
  };
}