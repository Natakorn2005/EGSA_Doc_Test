import { auth, signIn } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getTranslations } from "next-intl/server";
import { colors, buttonPrimaryStyle } from "@/lib/theme";
import MyDocumentsList, { MyDoc } from "./MyDocumentsList";
import Link from "next/link";

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
    // รอบที่ถูกตีกลับแล้วยื่นแก้ไปแล้ว — ไม่ต้องเตือนให้ทำต่อ (ดูจาก Reference ID ของแถวอื่น)
    const resubmittedAs = new Map<string, string>();
    for (const r of data.rows) {
      const ref = cell(data.headers, r, "Reference ID").trim();
      if (ref) resubmittedAs.set(ref, cell(data.headers, r, "Tracking ID").trim());
    }
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
        // ผู้ยื่นได้ "ฉบับเซ็นแล้ว" — ฉบับประทับเลขเป็นฉบับทดลอง ใช้งานจริงไม่ได้ (เจ้าหน้าที่ยังเห็นในฐานข้อมูลเอกสาร)
        finalFileUrl: cell(data.headers, row, "เอกสารเซ็นอนุมัติแล้ว"),
        resubmitLink: cell(data.headers, row, "ลิงก์ฟอร์มส่งเอกสารแก้"),
        sharePending: !!cell(data.headers, row, "รอแชร์ไฟล์").trim(),
        eduNumber: cell(data.headers, row, "เลข สวศ."),
        eduWordUrl: cell(data.headers, row, "ไฟล์ Word จากการศึกษา"),
        eduPdfUrl: cell(data.headers, row, "ไฟล์ PDF จากการศึกษา"),
        signedUrl: cell(data.headers, row, "ไฟล์ที่ประธาน/อาจารย์เซ็นแล้ว"),
        rejectType: cell(data.headers, row, "แบบการตีกลับ"),
        resubmittedAs: resubmittedAs.get(cell(data.headers, row, "Tracking ID").trim()) || "",
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
          <Link href="/submit" style={{ color: colors.primary }}>
            {t("submitNew")}
          </Link>
        </p>
      )}

      {!error && docs.length > 0 && (
        <>
          <MyDocumentsList docs={docs} />
        </>
      )}
    </div>
  );
}