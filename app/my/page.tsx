import { auth, signIn } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getTranslations } from "next-intl/server";
import { colors, cardStyle, buttonPrimaryStyle } from "@/lib/theme";
import MyDocumentsList, { MyDoc } from "./MyDocumentsList";

export const dynamic = "force-dynamic";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function MyPage() {
  const t = await getTranslations("my");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{t("title")}</h1>
        <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 }}>{t("loginPrompt")}</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/my" });
          }}
        >
          <button type="submit" style={buttonPrimaryStyle}>
            {tn("signIn")}
          </button>
        </form>
      </div>
    );
  }

  let docs: MyDoc[] = [];
  let error: string | null = null;

  try {
    const data = await getSecretarySheet();
    const emailCol = data.headers.indexOf("อีเมล");
    const normalized = session.user.email.trim().toLowerCase();
    docs = data.rows
      .filter((row) => (row[emailCol] || "").trim().toLowerCase() === normalized)
      .reverse()
      .map((row) => ({
        trackingId: cell(data.headers, row, "Tracking ID"),
        docName: cell(data.headers, row, "ชื่อเอกสาร"),
        status: cell(data.headers, row, "สถานะ"),
        submittedAt: cell(data.headers, row, "ประทับเวลา"),
        reviewedAt: cell(data.headers, row, "เวลาที่ตรวจสอบ"),
        approvedAt: cell(data.headers, row, "เวลาที่อนุมัติ"),
        reviewer: cell(data.headers, row, "ผู้ตรวจสอบ"),
        approver: cell(data.headers, row, "ผู้เซ็นอนุมัติ"),
        docNumber: cell(data.headers, row, "เลขเอกสาร"),
        rejectReason: cell(data.headers, row, "เหตุผลตีกลับ"),
        fileUrl: cell(data.headers, row, "เอกสารที่ต้องการยื่น"),
        finalFileUrl: cell(data.headers, row, "ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)"),
        resubmitLink: cell(data.headers, row, "ลิงก์ฟอร์มส่งเอกสารแก้"),
      }));
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 13 }}>
        {t("loggedInAs")}: {session.user.email} · {docs.length} {t("itemsCount")}
      </p>

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          {tc("connectionError")}: {error}
        </div>
      )}

      {!error && docs.length === 0 && (
        <p style={{ color: colors.textSecondary, fontSize: 14 }}>
          {t("empty")}{" "}
          <a href="/submit" style={{ color: colors.primary }}>
            {t("submitNew")}
          </a>
        </p>
      )}

      {!error && docs.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {(
              [
                { key: "รอตรวจสอบ", labelKey: "summaryPending" },
                { key: "รอเซ็น", labelKey: "summaryWaitingSign" },
                { key: "อนุมัติ", labelKey: "summaryApproved" },
                { key: "ตีกลับ", labelKey: "summaryRejected" },
              ] as const
            ).map((s) => {
              const count = docs.filter((d) => d.status === s.key).length;
              return (
                <div key={s.key} style={{ ...cardStyle, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color: colors.primary }}>{count}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{t(s.labelKey)}</div>
                </div>
              );
            })}
          </div>
          <MyDocumentsList docs={docs} />
        </>
      )}
    </div>
  );
}