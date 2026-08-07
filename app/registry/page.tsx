import { getSheetValues } from "@/lib/googleSheets";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";
import RegistryTable, { RegistryRow } from "./RegistryTable";

export const dynamic = "force-dynamic";

const REGISTRY_TAB_NAME = "ทะเบียนหนังสือส่ง";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function RegistryPage() {
  const t = await getTranslations("registry");
  const tc = await getTranslations("common");

  let rows: RegistryRow[] = [];
  let error: string | null = null;

  try {
    const [registryData, mainData] = await Promise.all([
      getSheetValues(REGISTRY_TAB_NAME),
      getSecretarySheet(),
    ]);

    // *** สร้างตารางอ้างอิง Tracking ID -> ลิงก์ไฟล์สุดท้าย จากชีตหลัก ***
    // เพราะแท็บทะเบียนหนังสือส่งเองไม่มีคอลัมน์ลิงก์ไฟล์ เก็บแค่เลขที่/วันที่/ชื่อเรื่อง/ผู้ส่ง/ผู้อนุมัติ
    const trackingCol = mainData.headers.indexOf("Tracking ID");
    const finalLinkCol = mainData.headers.indexOf("ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)");
    const fileByTrackingId: Record<string, string> = {};
    if (trackingCol !== -1 && finalLinkCol !== -1) {
      for (const row of mainData.rows) {
        const id = (row[trackingCol] || "").trim();
        if (id) fileByTrackingId[id] = row[finalLinkCol] || "";
      }
    }

    // เรียงตามลำดับที่บันทึกไว้ในชีตอยู่แล้ว (ออกเลขน้อยไปมาก ตามธรรมเนียมทะเบียนดั้งเดิม)
    rows = registryData.rows.map((row) => {
      const trackingId = cell(registryData.headers, row, "Tracking ID");
      return {
        docNumber: cell(registryData.headers, row, "เลขที่เอกสาร"),
        issuedAt: cell(registryData.headers, row, "วันที่ออกเลข"),
        trackingId,
        title: cell(registryData.headers, row, "ชื่อเรื่อง"),
        sender: cell(registryData.headers, row, "ผู้ส่ง"),
        approver: cell(registryData.headers, row, "ผู้อนุมัติ"),
        fileUrl: fileByTrackingId[trackingId] || "",
      };
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 20px" }}>{t("subtitle")}</p>

      {error ? (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 8 }}>
          {tc("connectionError")}: {error}
        </div>
      ) : (
        <RegistryTable rows={rows} />
      )}
    </div>
  );
}