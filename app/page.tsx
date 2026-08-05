import { getSecretarySheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data = null;
  let error: string | null = null;

  try {
    data = await getSecretarySheet();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>ระบบส่งเอกสาร (read-only)</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        ดึงข้อมูลสดจาก Google Sheet ผ่าน service account
      </p>

      {error && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 6 }}>
          เชื่อมต่อไม่สำเร็จ: {error}
        </div>
      )}

      {data && !error && data.rows.length === 0 && <p>ยังไม่มีข้อมูลในแท็บนี้</p>}

      {data && data.rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                {data.headers.map((h, i) => (
                  <th key={i} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={tdStyle}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "6px 10px",
  background: "#f5f5f5",
  textAlign: "left",
  position: "sticky",
  top: 0,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #eee",
  padding: "6px 10px",
};
