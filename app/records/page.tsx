import { getSecretarySheet } from "@/lib/googleSheets";
import { getTranslations, getLocale } from "next-intl/server";
import { colors, cardStyle } from "@/lib/theme";
import { getMonthKey } from "@/lib/dateFormat";
import RecordsTable, { RecordRow } from "./RecordsTable";

export const dynamic = "force-dynamic";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function RecordsPage() {
  const t = await getTranslations("records");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  let records: RecordRow[] = [];
  let error: string | null = null;
  let monthlySummary: { key: string; label: string; submitted: number; approved: number; rejected: number; pending: number }[] = [];

  try {
    const data = await getSecretarySheet();
    records = data.rows.map((row) => ({
      trackingId: cell(data.headers, row, "Tracking ID"),
      docName: cell(data.headers, row, "ชื่อเอกสาร"),
      applicant: cell(data.headers, row, "ชื่อ - นามสกุล"),
      agency:
        cell(data.headers, row, "ฝ่ายภายในสโมสร") ||
        cell(data.headers, row, "ชมรม") ||
        cell(data.headers, row, "ภาควิชา"),
      status: cell(data.headers, row, "สถานะ"),
      submittedAt: cell(data.headers, row, "ประทับเวลา"),
      docNumber: cell(data.headers, row, "เลขเอกสาร"),
      reviewedAt: cell(data.headers, row, "เวลาที่ตรวจสอบ"),
      approvedAt: cell(data.headers, row, "เวลาที่อนุมัติ"),
      reviewer: cell(data.headers, row, "ผู้ตรวจสอบ (เลขาฯ)"),
      approver: cell(data.headers, row, "ผู้เซ็นอนุมัติ"),
      rejectReason: cell(data.headers, row, "เหตุผลตีกลับ"),
      fileUrl: cell(data.headers, row, "เอกสารที่ต้องการยื่น"),
      finalFileUrl: cell(data.headers, row, "ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)"),
      resubmitLink: cell(data.headers, row, "ลิงก์ฟอร์มส่งเอกสารแก้"),
    }));

    // *** สรุปรายเดือน — จัดกลุ่มตามเดือนที่ยื่น แล้วนับสถานะปัจจุบันของแต่ละกลุ่ม ***
    // หมายเหตุ: การแยกเดือนอ้างอิงจากค่าที่อ่านได้จากชีต ถ้ารูปแบบวันที่ในชีตแปลกไป
    // (เช่น พ.ศ. หรือ locale อื่น) การจัดกลุ่มอาจคลาดเคลื่อน ควรตรวจสอบผลลัพธ์เทียบกับชีตจริง
    const groups: Record<string, { submitted: number; approved: number; rejected: number; pending: number }> = {};
    for (const r of records) {
      const key = getMonthKey(r.submittedAt);
      if (!groups[key]) groups[key] = { submitted: 0, approved: 0, rejected: 0, pending: 0 };
      groups[key].submitted++;
      if (r.status === "อนุมัติ") groups[key].approved++;
      else if (r.status === "ตีกลับ") groups[key].rejected++;
      else groups[key].pending++;
    }

    const formatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
      month: "long",
      year: "numeric",
    });

    monthlySummary = Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, counts]) => {
        let label = t("unknownMonth");
        if (key !== "unknown") {
          const [y, m] = key.split("-").map(Number);
          label = formatter.format(new Date(y, m - 1, 1));
        }
        return { key, label, ...counts };
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
        <>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>{t("summaryTitle")}</h2>
          <div style={{ overflowX: "auto", marginBottom: 28 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  {[t("summaryMonth"), t("summarySubmitted"), t("summaryApproved"), t("summaryRejected"), t("summaryPending")].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          background: colors.tint,
                          color: colors.primaryDark,
                          borderBottom: `2px solid ${colors.tintBorder}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((m) => (
                  <tr key={m.key}>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{m.label}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{m.submitted}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, color: "#1b5e20" }}>
                      {m.approved}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, color: colors.primaryDark }}>
                      {m.rejected}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, color: "#8a4b00" }}>
                      {m.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <RecordsTable records={records} months={monthlySummary.map((m) => ({ key: m.key, label: m.label }))} />
        </>
      )}
    </div>
  );
}
