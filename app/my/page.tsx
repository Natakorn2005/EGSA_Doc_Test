import { auth, signIn } from "@/auth";
import { getSecretarySheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { label: "รอตรวจสอบ", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { label: "รอเซ็นอนุมัติ", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { label: "อนุมัติแล้ว", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { label: "ถูกตีกลับ", color: "#b00020", bg: "#fff3f3" },
};

function getCell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function MyPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>เอกสารของฉัน</h1>
        <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
          เข้าสู่ระบบด้วย Google เพื่อดูรายการเอกสารทั้งหมดที่ท่านเคยยื่น
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/my" });
          }}
        >
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#2e7d32",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </form>
      </main>
    );
  }

  let headers: string[] = [];
  let myRows: string[][] = [];
  let error: string | null = null;

  try {
    const data = await getSecretarySheet();
    headers = data.headers;
    const emailCol = headers.indexOf("อีเมล");
    const normalized = session.user.email.trim().toLowerCase();
    myRows = data.rows
      .filter((row) => (row[emailCol] || "").trim().toLowerCase() === normalized)
      .reverse(); // ชีตเรียงตามลำดับเวลาที่ยื่น -> reverse ให้รายการล่าสุดขึ้นก่อน
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>เอกสารของฉัน</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 13 }}>
        เข้าสู่ระบบในนาม: {session.user.email} · {myRows.length} รายการ
      </p>

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          เชื่อมต่อไม่สำเร็จ: {error}
        </div>
      )}

      {!error && myRows.length === 0 && (
        <p style={{ color: "#666", fontSize: 14 }}>
          ยังไม่พบเอกสารที่ยื่นด้วยอีเมลนี้ —{" "}
          <a href="/submit" style={{ color: "#2e7d32" }}>
            ยื่นเอกสารใหม่
          </a>
        </p>
      )}

      {myRows.map((row, i) => {
        const status = getCell(headers, row, "สถานะ");
        const meta = STATUS_LABELS[status] || { label: status || "ไม่ทราบสถานะ", color: "#444", bg: "#f5f5f5" };
        const trackingId = getCell(headers, row, "Tracking ID");
        const docName = getCell(headers, row, "ชื่อเอกสาร");
        const submittedAt = getCell(headers, row, "ประทับเวลา");

        return (
          <a
            key={i}
            href={`/status?q=${encodeURIComponent(trackingId)}`}
            style={{
              display: "block",
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: meta.bg,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{docName || trackingId}</strong>
              <span style={{ color: meta.color, fontWeight: 600, fontSize: 13 }}>{meta.label}</span>
            </div>
            <p style={{ color: "#666", fontSize: 13, margin: "6px 0 0" }}>
              รหัสอ้างอิง: {trackingId} · ยื่นเมื่อ: {submittedAt || "-"}
            </p>
          </a>
        );
      })}
    </main>
  );
}