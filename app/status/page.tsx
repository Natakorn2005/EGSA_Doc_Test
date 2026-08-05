import { getSecretarySheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { label: "รอตรวจสอบ", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { label: "รอเซ็นอนุมัติ", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { label: "อนุมัติแล้ว", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { label: "ถูกตีกลับ", color: "#b00020", bg: "#fff3f3" },
};

function findMatches(headers: string[], rows: string[][], query: string) {
  const trimmed = query.trim().toLowerCase();
  const trackingCol = headers.indexOf("Tracking ID");
  const emailCol = headers.indexOf("อีเมล");

  return rows.filter((row) => {
    const tracking = (row[trackingCol] || "").trim().toLowerCase();
    const email = (row[emailCol] || "").trim().toLowerCase();
    return tracking === trimmed || email === trimmed;
  });
}

function getCell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let matches: string[][] = [];
  let headers: string[] = [];
  let error: string | null = null;

  if (query) {
    try {
      const data = await getSecretarySheet();
      headers = data.headers;
      matches = findMatches(data.headers, data.rows, query);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>ตรวจสอบสถานะเอกสาร</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        กรอกรหัสอ้างอิง (Tracking ID) หรืออีเมลที่ใช้ยื่นเอกสาร
      </p>

      <form method="get" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="เช่น TRK-20260805-002 หรือ อีเมลของท่าน"
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ค้นหา
        </button>
      </form>

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          เชื่อมต่อไม่สำเร็จ: {error}
        </div>
      )}

      {query && !error && matches.length === 0 && (
        <p>ไม่พบเอกสารที่ตรงกับ &quot;{query}&quot; กรุณาตรวจสอบรหัสหรืออีเมลอีกครั้ง</p>
      )}

      {matches.map((row, i) => {
        const status = getCell(headers, row, "สถานะ");
        const meta = STATUS_LABELS[status] || { label: status || "ไม่ทราบสถานะ", color: "#444", bg: "#f5f5f5" };
        const trackingId = getCell(headers, row, "Tracking ID");
        const docName = getCell(headers, row, "ชื่อเอกสาร");
        const submittedAt = getCell(headers, row, "ประทับเวลา");
        const rejectReason = getCell(headers, row, "เหตุผลตีกลับ");
        const resubmitLink = getCell(headers, row, "ลิงก์ฟอร์มส่งเอกสารแก้");
        const docNumber = getCell(headers, row, "เลขเอกสาร");
        const finalLink = getCell(headers, row, "ลิงก์ไฟล์สุดท้าย (ประทับเลขแล้ว)");
        const approvedAt = getCell(headers, row, "เวลาที่อนุมัติ");

        return (
          <div
            key={i}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: meta.bg,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{docName || trackingId}</strong>
              <span style={{ color: meta.color, fontWeight: 600, fontSize: 13 }}>{meta.label}</span>
            </div>
            <p style={{ color: "#666", fontSize: 13, margin: "6px 0" }}>
              รหัสอ้างอิง: {trackingId} · ยื่นเมื่อ: {submittedAt || "-"}
            </p>

            {status === "ตีกลับ" && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <p style={{ color: "#b00020" }}>เหตุผล: {rejectReason || "-"}</p>
                {resubmitLink && (
                  <a href={resubmitLink} style={{ color: "#2e7d32" }}>
                    ยื่นเอกสารแก้ไข →
                  </a>
                )}
              </div>
            )}

            {status === "อนุมัติ" && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <p>เลขที่เอกสาร: <strong>{docNumber}</strong></p>
                <p style={{ color: "#666" }}>อนุมัติเมื่อ: {approvedAt || "-"}</p>
                {finalLink && (
                  <a href={finalLink} style={{ color: "#2e7d32" }}>
                    เปิดไฟล์เอกสาร →
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}