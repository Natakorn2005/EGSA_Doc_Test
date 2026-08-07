import { getSecretarySheet } from "@/lib/googleSheets";
import { getReviewerOptions } from "@/lib/roles";
import { getTranslations } from "next-intl/server";
import QueuePanel, { QueueDoc } from "@/components/QueuePanel";
import { colors } from "@/lib/theme";

export const dynamic = "force-dynamic";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function SecretaryPage() {
  const t = await getTranslations("queue");
  const tc = await getTranslations("common");
  let docs: QueueDoc[] = [];
  let error: string | null = null;

  try {
    const data = await getSecretarySheet();
    const statusCol = data.headers.indexOf("สถานะ");
    docs = data.rows
      .filter((row) => row[statusCol] === "รอตรวจสอบ")
      .map((row) => ({
        trackingId: cell(data.headers, row, "Tracking ID"),
        docName: cell(data.headers, row, "ชื่อเอกสาร"),
        applicant: cell(data.headers, row, "ชื่อ - นามสกุล"),
        agencyType: cell(data.headers, row, "หน่วยงานที่ยื่นเอกสาร").trim(),
        agencyValue:
          cell(data.headers, row, "ฝ่ายภายในสโมสร") ||
          cell(data.headers, row, "ชมรม") ||
          cell(data.headers, row, "ภาควิชา"),
        submittedAt: cell(data.headers, row, "ประทับเวลา"),
        reviewer: "",
        fileUrl: cell(data.headers, row, "เอกสารที่ต้องการยื่น"),
      }));
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const reviewerOptions = await getReviewerOptions();

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>{t("secretaryTitle")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 20px" }}>
        {docs.length} {t("itemsPending")}
      </p>

      {error ? (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 8 }}>
          {tc("connectionError")}: {error}
        </div>
      ) : (
        <QueuePanel docs={docs} mode="secretary" reviewerOptions={reviewerOptions} />
      )}
    </div>
  );
}