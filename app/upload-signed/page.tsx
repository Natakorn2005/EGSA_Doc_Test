import Link from "next/link";
import { auth } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";
import UploadSignedForm from "./UploadSignedForm";

export const dynamic = "force-dynamic";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

/**
 * อัปโหลดฉบับที่ประธานโครงการและอาจารย์เซ็นแล้ว ในเอกสารเดิม (ขั้น 5)
 * มาจากปุ่มในอีเมลที่การศึกษาส่งคืน หรือจากหน้าเอกสารของฉัน — ต้องเข้าสู่ระบบด้วยอีเมลที่ใช้ยื่น (proxy.ts)
 */
export default async function UploadSignedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; resubmit?: string }>;
}) {
  const t = await getTranslations("uploadSigned");
  const tc = await getTranslations("common");
  const session = await auth();
  const params = await searchParams;
  // ?resubmit=<รหัสที่ถูกตีกลับแบบเล็ก> = ส่งฉบับเซ็นใหม่เป็นรอบใหม่ / ?id=<รหัส> = ส่งฉบับเซ็นครั้งแรก (ขั้น 5)
  const resubmitOf = (params.resubmit || "").trim();
  const trackingId = (resubmitOf || params.id || "").trim();
  const email = (session?.user?.email || "").trim().toLowerCase();

  let message: string | null = null;
  let doc: {
    trackingId: string;
    docName: string;
    eduNumber: string;
    eduWordUrl: string;
    eduPdfUrl: string;
    eduPdfHash: string;
    sharePending: boolean;
    resubmitOf: string;
    rejectReason: string;
    rejectBy: string;
    rejectFileUrl: string;
  } | null = null;

  if (!trackingId) {
    message = t("missingId");
  } else {
    try {
      const { headers, rows } = await getSecretarySheet();
      const row = rows.find((r) => cell(headers, r, "Tracking ID").trim() === trackingId);
      // ไม่บอกว่ามีรหัสนี้หรือไม่ ถ้าไม่ใช่เอกสารของอีเมลนี้ (กันเดารหัสของคนอื่น)
      if (!row || cell(headers, row, "อีเมล").trim().toLowerCase() !== email) {
        message = t("notYours");
      } else {
        const status = cell(headers, row, "สถานะ");
        const resubmittedAs = rows.find((r) => cell(headers, r, "Reference ID").trim() === trackingId);
        if (resubmitOf && (status !== "ตีกลับ" || cell(headers, row, "แบบการตีกลับ") !== "เล็ก")) {
          message = t("notSmallReject");
        } else if (resubmitOf && resubmittedAs) {
          message = t("alreadyResubmitted", { id: cell(headers, resubmittedAs, "Tracking ID") });
        } else if (!resubmitOf && status !== "รอเซ็นประธาน/อาจารย์") {
          message = t("notWaiting", { status });
        } else {
          doc = {
            trackingId,
            docName: cell(headers, row, "ชื่อเอกสาร"),
            eduNumber: cell(headers, row, "เลข สวศ."),
            eduWordUrl: cell(headers, row, "ไฟล์ Word จากการศึกษา"),
            eduPdfUrl: cell(headers, row, "ไฟล์ PDF จากการศึกษา"),
            eduPdfHash: cell(headers, row, "แฮช PDF จากการศึกษา").trim(),
            sharePending: !!cell(headers, row, "รอแชร์ไฟล์").trim(),
            resubmitOf,
            rejectReason: resubmitOf ? cell(headers, row, "เหตุผลตีกลับ") : "",
            rejectBy: resubmitOf ? cell(headers, row, "ตีกลับโดย") : "",
            rejectFileUrl: resubmitOf ? cell(headers, row, "ลิงก์ไฟล์วงแดง") : "",
          };
        }
      }
    } catch (e) {
      message = `${tc("connectionError")}: ${e instanceof Error ? e.message : "Unknown error"}`;
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "8px 0" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{resubmitOf ? t("titleResubmit") : t("title")}</h1>
      <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 13 }}>
        {resubmitOf ? t("subtitleResubmit") : t("subtitle")}
      </p>

      {message || !doc ? (
        <div style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8, padding: 14, fontSize: 13 }}>
          <p style={{ margin: "0 0 10px" }}>{message}</p>
          <Link href="/my" style={{ color: colors.primary }}>
            {t("goMyDocs")}
          </Link>
        </div>
      ) : (
        <UploadSignedForm doc={doc} />
      )}
    </div>
  );
}
