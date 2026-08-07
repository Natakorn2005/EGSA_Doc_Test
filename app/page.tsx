import { auth, signIn } from "@/auth";
import { getStaffRole, getRoleI18nKey, isSignerRole, isSecretaryRole } from "@/lib/roles";
import { getUserProfile } from "@/lib/profile";
import { getSecretarySheet } from "@/lib/googleSheets";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { colors, heroStyle, cardStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { key: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { key: "statusPending", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { key: "statusWaitingSign", color: "#8a4b00", bg: "#fff3e0" },
  "ตีกลับ": { key: "statusRejected", color: colors.primaryDark, bg: colors.tint },
};

function cell(headers: string[], row: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx === -1 ? "" : row[idx] || "";
}

export default async function HomePage() {
  const session = await auth();
  const t = await getTranslations();

  // ---- ยังไม่ได้ล็อกอิน ---- (เต็มจอ ไม่ถูกจำกัดโดย AppShell)
  if (!session?.user?.email) {
    const steps = [
      { icon: "ti-file-plus", titleKey: "stepSubmitTitle", descKey: "stepSubmitDesc" },
      { icon: "ti-checklist", titleKey: "stepReviewTitle", descKey: "stepReviewDesc" },
      { icon: "ti-signature", titleKey: "stepApproveTitle", descKey: "stepApproveDesc" },
    ];

    return (
      <div className="egsa-fullscreen-home" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="egsa-home-panels" style={{ display: "flex", flex: 1 }}>
          <div
            style={{
              flex: "1 1 55%",
              background: "#fff",
              padding: "48px 56px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: colors.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 7,
                  marginBottom: 22,
                }}
              >
                <img src="/egsa-logo.png" alt="EGSA" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <h1 style={{ fontSize: 30, margin: "0 0 8px", color: colors.text }}>{t("home.faculty")}</h1>
              <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 28px" }}>
                {t("home.loggedOutSubtitle")}
              </p>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
                style={{ marginBottom: 20 }}
              >
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    background: colors.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {t("nav.signIn")}
                </button>
              </form>

              <p style={{ color: colors.textMuted, fontSize: 11, margin: "0 0 10px" }}>{t("home.orUseWithoutLogin")}</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
                <a href="/submit" className="egsa-outline-btn" style={{ flex: 1, textAlign: "center" }}>
                  <i className="ti ti-file-plus" style={{ fontSize: 16 }} aria-hidden="true" />
                  {t("nav.submit")}
                </a>
                <a href="/status" className="egsa-outline-btn" style={{ flex: 1, textAlign: "center" }}>
                  <i className="ti ti-search" style={{ fontSize: 16 }} aria-hidden="true" />
                  {t("nav.status")}
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: colors.tint,
                        color: colors.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                      }}
                    >
                      <i className={`ti ${step.icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500 }}>{t(`home.${step.titleKey}`)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="egsa-home-illustration"
            style={{
              flex: "1 1 45%",
              position: "relative",
              backgroundImage: `linear-gradient(160deg, rgba(110,20,35,0.55) 0%, rgba(168,50,72,0.78) 100%), url('/campus-hero.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center 65%",
              display: "flex",
              alignItems: "flex-end",
              padding: 40,
            }}
          >
            <p style={{ color: "#fff", fontSize: 15, margin: 0, opacity: 0.95, maxWidth: 280 }}>{t("home.orgName")}</p>
          </div>
        </div>

        <style>{`
          .egsa-outline-btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 6px;
            border: 1.5px solid ${colors.primary}; color: ${colors.primary};
            border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: var(--font-body);
            text-decoration: none; transition: background 0.15s, color 0.15s;
          }
          .egsa-outline-btn:hover { background: ${colors.primary}; color: #fff; }
          @media (max-width: 768px) {
            .egsa-home-panels { flex-direction: column; }
            .egsa-home-illustration { min-height: 220px; }
          }
        `}</style>
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

  const roleLabel = t(`role.${getRoleI18nKey(role)}`);
  const displayName = session.user.name || email;
  const isSigner = isSignerRole(role);

  let stats = { a: 0, b: 0, c: 0 };
  let statKeys = { a: "statPendingReview", b: "statPendingSign", c: "statApproved" };
  let statsError = false;

  type NotifItem = { trackingId: string; docName: string; applicant: string; status: string };
  let notifications: NotifItem[] = [];
  let notifQueueLink = "/secretary";
  const isStaffView = isSecretaryRole(role) || isSigner;

  try {
    const data = await getSecretarySheet();
    const statusCol = data.headers.indexOf("สถานะ");
    const emailCol = data.headers.indexOf("อีเมล");

    if (isSecretaryRole(role)) {
      statKeys = { a: "statPendingReview", b: "statPendingSign", c: "statApproved" };
      stats = {
        a: data.rows.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        b: data.rows.filter((r) => r[statusCol] === "รอเซ็น").length,
        c: data.rows.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
      notifQueueLink = "/secretary";
      notifications = data.rows
        .filter((r) => r[statusCol] === "รอตรวจสอบ")
        .slice(0, 5)
        .map((r) => ({
          trackingId: cell(data.headers, r, "Tracking ID"),
          docName: cell(data.headers, r, "ชื่อเอกสาร"),
          applicant: cell(data.headers, r, "ชื่อ - นามสกุล"),
          status: "รอตรวจสอบ",
        }));
    } else if (isSigner) {
      statKeys = { a: "statPendingSign", b: "statPendingReview", c: "statApproved" };
      stats = {
        a: data.rows.filter((r) => r[statusCol] === "รอเซ็น").length,
        b: data.rows.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        c: data.rows.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
      notifQueueLink = "/president";
      notifications = data.rows
        .filter((r) => r[statusCol] === "รอเซ็น")
        .slice(0, 5)
        .map((r) => ({
          trackingId: cell(data.headers, r, "Tracking ID"),
          docName: cell(data.headers, r, "ชื่อเอกสาร"),
          applicant: cell(data.headers, r, "ชื่อ - นามสกุล"),
          status: "รอเซ็น",
        }));
    } else {
      const normalized = email.trim().toLowerCase();
      const mine = data.rows.filter((r) => (r[emailCol] || "").trim().toLowerCase() === normalized);
      statKeys = { a: "statPendingReview", b: "statPendingSign", c: "statApproved" };
      stats = {
        a: mine.filter((r) => r[statusCol] === "รอตรวจสอบ").length,
        b: mine.filter((r) => r[statusCol] === "รอเซ็น").length,
        c: mine.filter((r) => r[statusCol] === "อนุมัติ").length,
      };
      // นักศึกษา: เอกสารตีกลับก่อน (ต้องดำเนินการ) ตามด้วยที่กำลังดำเนินอยู่ — สูงสุด 5 รายการ
      const rejected = mine.filter((r) => r[statusCol] === "ตีกลับ");
      const inProgress = mine.filter((r) => r[statusCol] === "รอตรวจสอบ" || r[statusCol] === "รอเซ็น");
      notifications = [...rejected, ...inProgress].slice(0, 5).map((r) => ({
        trackingId: cell(data.headers, r, "Tracking ID"),
        docName: cell(data.headers, r, "ชื่อเอกสาร"),
        applicant: "",
        status: r[statusCol],
      }));
    }
  } catch {
    statsError = true;
  }

  return (
    <div>
      <div style={heroStyle}>
        <p style={{ color: "#F3D0D4", fontSize: 13, margin: "0 0 2px" }}>{t("home.welcome")}</p>
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

      {statsError && (
        <div style={{ color: "#b00020", background: "#fff3f3", padding: 12, borderRadius: 8, margin: "20px 0" }}>
          {t("common.connectionError")}
        </div>
      )}

      {!statsError && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "20px 0" }}>
            {(["a", "b", "c"] as const).map((k) => (
              <div key={k} style={cardStyle}>
                <div style={{ fontSize: 13, color: colors.textSecondary }}>{t(`home.${statKeys[k]}`)}</div>
                <div style={{ fontSize: 28, fontWeight: 500, color: colors.primary }}>{stats[k]}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>
                {isStaffView ? t("home.notificationsTitleStaff") : t("home.notificationsTitleStudent")}
              </h2>
              {isStaffView && notifications.length > 0 && (
                <a href={notifQueueLink} style={{ color: colors.primary, fontSize: 13 }}>
                  {t("home.viewAllInQueue")}
                </a>
              )}
            </div>

            {notifications.length === 0 && (
              <div
                style={{
                  ...cardStyle,
                  textAlign: "center",
                  padding: "24px 16px",
                  color: colors.textSecondary,
                  fontSize: 14,
                }}
              >
                {t("home.noNotifications")}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notifications.map((n) => {
                const meta = STATUS_META[n.status];
                return (
                  <a
                    key={n.trackingId}
                    href={isStaffView ? notifQueueLink : `/status?q=${encodeURIComponent(n.trackingId)}`}
                    style={{
                      ...cardStyle,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "inherit",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.docName || n.trackingId}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        {n.applicant ? `${n.applicant} · ` : ""}
                        {n.trackingId}
                      </div>
                    </div>
                    {meta && (
                      <span
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {t(`status.${meta.key}`)}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}