import { auth } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getStaffRole } from "@/lib/roles";
import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";

export const dynamic = "force-dynamic";

const STATUS_KEY_MAP: Record<string, { key: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { key: "statusPending", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { key: "statusWaitingSign", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { key: "statusApproved", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { key: "statusRejected", color: colors.primaryDark, bg: colors.tint },
};

function getCell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

/**
 * *** ค้นหาแบบต้องยืนยันตัวตนสองชั้น ***
 * เดิม: รู้ Tracking ID อย่างเดียวก็ดูได้ — ซึ่ง Tracking ID เดารูปแบบได้ (TRK-YYYYMMDD-XXX)
 * ตอนนี้: ต้องใส่ Tracking ID *และ* ข้อมูลยืนยันที่ตรงกับแถวนั้นจริง (อีเมล หรือ เบอร์โทร)
 * คนที่ไล่เดา Tracking ID เฉย ๆ จะไม่เห็นอะไรเลย เพราะไม่รู้อีเมล/เบอร์ของเจ้าของเอกสาร
 *
 * ผู้ใช้ที่ล็อกอินอยู่แล้วและอีเมลตรงกับแถวนั้น ไม่ต้องใส่ข้อมูลยืนยันซ้ำ (สะดวกขึ้น ไม่ลดความปลอดภัย
 * เพราะ Google ยืนยันตัวตนให้แล้ว) และเจ้าหน้าที่ดูได้ทุกแถวตามปกติ
 */
function findMatches(
  headers: string[],
  rows: string[][],
  trackingQuery: string,
  verifyQuery: string,
  viewerEmail: string | null,
  isStaffViewer: boolean
) {
  const tracking = trackingQuery.trim().toLowerCase();
  const verify = verifyQuery.trim().toLowerCase();
  const trackingCol = headers.indexOf("Tracking ID");
  const emailCol = headers.indexOf("อีเมล");
  const phoneCol = headers.indexOf("เบอร์โทรสำหรับติดต่อ");

  return rows.filter((row) => {
    const rowTracking = (row[trackingCol] || "").trim().toLowerCase();
    if (rowTracking !== tracking) return false;

    // เจ้าหน้าที่ดูได้ทุกแถว
    if (isStaffViewer) return true;

    const rowEmail = (row[emailCol] || "").trim().toLowerCase();
    const rowPhone = (row[phoneCol] || "").trim().toLowerCase();

    // เจ้าของเอกสารที่ล็อกอินอยู่แล้ว ไม่ต้องใส่ข้อมูลยืนยันซ้ำ
    if (viewerEmail && viewerEmail === rowEmail) return true;

    // นอกนั้นต้องใส่ข้อมูลยืนยันที่ตรงกับแถวนี้จริง
    if (!verify) return false;
    return verify === rowEmail || verify === rowPhone;
  });
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; v?: string }>;
}) {
  const t = await getTranslations("status");
  const tc = await getTranslations("common");
  const { q, v } = await searchParams;
  const session = await auth();

  const query = q?.trim() || "";
  const verify = v?.trim() || "";

  const viewerEmail = session?.user?.email?.trim().toLowerCase() || null;
  const viewerRole = viewerEmail ? await getStaffRole(viewerEmail) : null;
  const isStaffViewer = !!viewerRole;

  let matches: string[][] = [];
  let headers: string[] = [];
  let error: string | null = null;

  if (query) {
    try {
      const data = await getSecretarySheet();
      headers = data.headers;
      matches = findMatches(data.headers, data.rows, query, verify, viewerEmail, isStaffViewer);
      matches = matches.slice().reverse();
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, marginBottom: 20 }}>{t("subtitle")}</p>

      <form method="get" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          style={{
            padding: "8px 12px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 6,
            fontSize: 14,
            fontFamily: "var(--font-body)",
          }}
        />
        {!isStaffViewer && (
          <>
            <input
              type="text"
              name="v"
              defaultValue={verify}
              placeholder={t("verifyPlaceholder")}
              style={{
                padding: "8px 12px",
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: 6,
                fontSize: 14,
                fontFamily: "var(--font-body)",
              }}
            />
            <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>{t("verifyHint")}</p>
          </>
        )}
        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          {t("searchButton")}
        </button>
      </form>

      {!query && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {Object.values(STATUS_KEY_MAP).map((meta) => (
            <span
              key={meta.key}
              style={{ background: meta.bg, color: meta.color, fontSize: 12, padding: "3px 10px", borderRadius: 20 }}
            >
              {t(meta.key)}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          {tc("connectionError")}: {error}
        </div>
      )}

      {/* *** ข้อความเดียวกันไม่ว่าจะหาไม่เจอเพราะ ID ผิด หรือข้อมูลยืนยันไม่ตรง ***
          กันการใช้ข้อความ error ต่างกันเพื่อไล่เดาว่า Tracking ID ไหนมีอยู่จริง */}
      {query && !error && matches.length === 0 && <p>{t("notFoundOrUnverified")}</p>}

      {matches.map((row, i) => {
        const status = getCell(headers, row, "สถานะ");
        const meta = STATUS_KEY_MAP[status];
        const label = meta ? t(meta.key) : status || t("statusUnknown");
        const color = meta?.color || "#444";
        const bg = meta?.bg || "#f5f5f5";
        const trackingId = getCell(headers, row, "Tracking ID");
        const docName = getCell(headers, row, "ชื่อเอกสาร");
        const submittedAt = getCell(headers, row, "ประทับเวลา");
        const rejectReason = getCell(headers, row, "เหตุผลตีกลับ");
        const resubmitLink = getCell(headers, row, "ลิงก์ฟอร์มส่งเอกสารแก้");
        const docNumber = getCell(headers, row, "เลขเอกสาร");
        const finalLink = getCell(headers, row, "ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)");
        const approvedAt = getCell(headers, row, "เวลาที่อนุมัติ");
        const rowEmail = getCell(headers, row, "อีเมล").trim().toLowerCase();
        const canViewFile = isStaffViewer || (viewerEmail && viewerEmail === rowEmail);

        return (
          <div key={i} style={{ border: `1px solid ${colors.cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 12, background: bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{docName || trackingId}</strong>
              <span style={{ color, fontWeight: 600, fontSize: 13 }}>{label}</span>
            </div>
            <p style={{ color: colors.textSecondary, fontSize: 13, margin: "6px 0" }}>
              {t("trackingId")}: {trackingId} · {t("submittedAt")}: {submittedAt || "-"}
            </p>

            {status === "ตีกลับ" && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <p style={{ color: "#b00020", marginBottom: 8 }}>{t("reasonLabel")}: {rejectReason || "-"}</p>
                {resubmitLink && (
                  <a href={resubmitLink} className="egsa-link-btn">
                    <i className="ti ti-edit" style={{ fontSize: 16 }} aria-hidden="true" />
                    {t("resubmitLink")}
                  </a>
                )}
              </div>
            )}

            {status === "อนุมัติ" && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <p>
                  {t("docNumberLabel")}: <strong>{docNumber}</strong>
                </p>
                <p style={{ color: colors.textSecondary, marginBottom: 8 }}>{t("approvedAt")}: {approvedAt || "-"}</p>
                {finalLink && canViewFile && (
                  <a href={finalLink} className="egsa-link-btn">
                    <i className="ti ti-file-check" style={{ fontSize: 16 }} aria-hidden="true" />
                    {t("openFile")}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}