import { auth } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

function getCell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function PresidentPage() {
  const session = await auth();

  let headers: string[] = [];
  let queue: string[][] = [];
  let error: string | null = null;

  try {
    const data = await getSecretarySheet();
    headers = data.headers;
    const statusCol = headers.indexOf("สถานะ");
    queue = data.rows.filter((row) => row[statusCol] === "รอเซ็น");
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>คิวเอกสารรอเซ็น</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        เข้าสู่ระบบในนาม: {session?.user?.email} · {queue.length} รายการรอเซ็น
      </p>

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          เชื่อมต่อไม่สำเร็จ: {error}
        </div>
      )}

      {!error && queue.length === 0 && <p>ไม่มีเอกสารรอเซ็นในขณะนี้</p>}

      {queue.map((row, i) => {
        const trackingId = getCell(headers, row, "Tracking ID");
        const docName = getCell(headers, row, "ชื่อเอกสาร");
        const applicant = getCell(headers, row, "ชื่อ - นามสกุล");
        const reviewer = getCell(headers, row, "ผู้ตรวจสอบ (เลขาฯ)");
        const fileUrl = getCell(headers, row, "เอกสารที่ต้องการยื่น");

        return (
          <div
            key={i}
            style={{
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <strong style={{ fontSize: 15 }}>{docName || trackingId}</strong>
            <p style={{ color: "#666", fontSize: 13, margin: "6px 0" }}>
              ผู้ยื่น: {applicant || "-"} · ตรวจสอบโดย: {reviewer || "-"}
            </p>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 8px" }}>
              รหัสอ้างอิง: {trackingId}
            </p>
            {fileUrl && (
              <a href={fileUrl} style={{ color: "#2e7d32", fontSize: 13 }}>
                เปิดเอกสารเพื่อพิจารณาเซ็น →
              </a>
            )}
          </div>
        );
      })}
    </main>
  );
}