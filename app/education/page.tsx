import { auth } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";
import { getStaffDisplayName } from "@/lib/roles";
import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";
import type { EduNumberUse } from "@/lib/eduNumber";
import EducationQueue, { type EduDoc } from "./EducationQueue";

export const dynamic = "force-dynamic";

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const t = await getTranslations("education");
  const tc = await getTranslations("common");
  const session = await auth();
  const { open } = await searchParams;

  let docs: EduDoc[] = [];
  let numberIndex: EduNumberUse[] = [];
  let error: string | null = null;

  try {
    const { headers, rows } = await getSecretarySheet();
    const get = (row: string[], name: string) => cell(headers, row, name);
    const byId = new Map(rows.map((r) => [get(r, "Tracking ID").trim(), r]));

    // รอบก่อนทั้งหมดของเรื่องเดียวกัน ไล่ตาม Reference ID
    const ancestors = (row: string[]): string[] => {
      const ids: string[] = [];
      let ref = get(row, "Reference ID").trim();
      while (ref && byId.has(ref) && !ids.includes(ref) && ids.length < 50) {
        ids.push(ref);
        ref = get(byId.get(ref)!, "Reference ID").trim();
      }
      return ids;
    };

    numberIndex = rows
      .filter((r) => get(r, "เลข สวศ.").trim())
      .map((r) => ({
        number: get(r, "เลข สวศ.").trim(),
        trackingId: get(r, "Tracking ID").trim(),
        docName: get(r, "ชื่อเอกสาร"),
        status: get(r, "สถานะ"),
      }));

    docs = rows
      .filter((r) => get(r, "สถานะ") === "รอการศึกษาตรวจ")
      .map((r) => {
        const chain = ancestors(r);
        const prev = chain.length ? byId.get(chain[0]) : undefined;
        // รอบก่อนมีเลข สวศ. แล้ว = กลับมาจากการตีกลับแบบใหญ่ → ป้าย "ตรวจใหม่"
        const prevNumber = prev ? get(prev, "เลข สวศ.").trim() : "";
        return {
          trackingId: get(r, "Tracking ID"),
          docName: get(r, "ชื่อเอกสาร"),
          applicant: get(r, "ชื่อ - นามสกุล"),
          phone: get(r, "เบอร์โทรสำหรับติดต่อ"),
          agency:
            get(r, "ฝ่ายภายในสโมสร") || get(r, "ชมรม") || get(r, "ภาควิชา") || get(r, "หน่วยงานอื่น ๆ") ||
            get(r, "หน่วยงานที่ยื่นเอกสาร"),
          submittedAt: get(r, "ประทับเวลา"),
          wordUrl: get(r, "เอกสารที่ต้องการยื่น"),
          sharePending: !!get(r, "รอแชร์ไฟล์").trim(),
          chainIds: chain,
          prevNumber,
          prevReason: prev && prevNumber ? get(prev, "เหตุผลตีกลับ") : "",
          prevRejectBy: prev && prevNumber ? get(prev, "ตีกลับโดย") : "",
        };
      });
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const actingAs = session?.user?.email ? await getStaffDisplayName(session.user.email) : null;

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>{t("queueTitle")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 20px" }}>
        {docs.length} {t("itemsPending")}
      </p>

      {error ? (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 8 }}>
          {tc("connectionError")}: {error}
        </div>
      ) : (
        <EducationQueue docs={docs} numberIndex={numberIndex} actingAs={actingAs} openId={open || null} />
      )}
    </div>
  );
}
