import { auth, signIn } from "@/auth";
import { getStaffRole, getRoleDisplayLabel, isSignerRole } from "@/lib/roles";
import { getUserProfile } from "@/lib/profile";
import { getSecretarySheet } from "@/lib/googleSheets";
import { redirect } from "next/navigation";
import { colors, heroStyle, cardStyle, buttonPrimaryStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  // ---- ยังไม่ได้ล็อกอิน ---- (AppShell แสดงเนื้อหาแบบไม่มี sidebar ให้อยู่แล้ว)
  if (!session?.user?.email) {
    return (
      <div>
        <div style={heroStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.primary,
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              EGSA
            </div>
            <span style={{ color: "#F3D0D4", fontSize: 13 }}>ระบบส่งเอกสารสโมสรนักศึกษา</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 24, margin: "0 0 6px" }}>คณะวิศวกรรมศาสตร์</h1>
          <p style={{ color: "#F3D0D4", fontSize: 13, margin: 0 }}>
            เข้าสู่ระบบด้วย Google เพื่อยื่นเอกสาร ตรวจสอบสถานะ หรือจัดการคิวเอกสาร
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          style={{ marginTop: 20 }}
        >
          <button type="submit" style={buttonPrimaryStyle}>
            เข้าสู่ระบบด้วย Google
          </button>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${colors.cardBorder}` }}>
          <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>
            หรือใช้งานโดยไม่ต้องเข้าสู่ระบบ:
          </p>
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <a href="/submit" style={{ color: colors.primary }}>ยื่นเอกสาร →</a>
            <a href="/status" style={{ color: colors.primary }}>ตรวจสอบสถานะเอกสาร →</a>
          </div>
        </div>
      </div>
    );
  }

  const email = session.user.email;
  const role = await getStaffRole(email);

  if (!role) {
    const profile = await getUserProfile(email);
    if (!profile) {
      redirect("/profile");
    }
  }

  const roleLabel = getRoleDisplayLabel(role);
  const displayName = session.user.name || email;
  const isSigner = isSignerRole(role);

  let stats = { a: 0, b: 0, c: 0 };
  let statLabels = { a: "-", b: "-", c: "-" };
  let statsError = false;

  try {
    const data = await getSecretarySheet();
    const statusCol = data.headers.indexOf("สถานะ");
    const emailCol = data.headers.indexOf("อีเมล");

    if (role === "secretary") {
      statLabels = { a: "รอตรวจ", b: "รอเซ็น", c: "อนุมัติแล้ว" };
      stats = {
        a: data.rows.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        b: data.rows.filter((r) => r[statusCol] === "รอเซ็น").length,
        c: data.rows.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
    } else if (isSigner) {
      statLabels = { a: "รอเซ็น", b: "รอตรวจ", c: "อนุมัติแล้ว" };
      stats = {
        a: data.rows.filter((r) => r[statusCol] === "รอเซ็น").length,
        b: data.rows.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        c: data.rows.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
    } else {
      const normalized = email.trim().toLowerCase();
      const mine = data.rows.filter((r) => (r[emailCol] || "").trim().toLowerCase() === normalized);
      statLabels = { a: "รอตรวจ", b: "รอเซ็น", c: "อนุมัติแล้ว" };
      stats = {
        a: mine.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        b: mine.filter((r) => r[statusCol] === "รอเซ็น").length,
        c: mine.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
    }
  } catch {
    statsError = true;
  }

  return (
    <div>
      <div style={heroStyle}>
        <p style={{ color: "#F3D0D4", fontSize: 13, margin: "0 0 2px" }}>ยินดีต้อนรับ,</p>
        <h1 style={{ color: "#fff", fontSize: 24, margin: "0 0 8px" }}>{displayName}</h1>
        <span
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.18)",
            color: "#fff",
            fontSize: 12,
            padding: "3px 12px",
            borderRadius: 20,
          }}
        >
          {roleLabel}
        </span>
      </div>

      {!statsError && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            margin: "20px 0",
          }}
        >
          {(["a", "b", "c"] as const).map((k) => (
            <div key={k} style={cardStyle}>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>{statLabels[k]}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: colors.primary }}>{stats[k]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}