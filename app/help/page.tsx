import { getTranslations } from "next-intl/server";
import { colors, cardStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const t = await getTranslations("help");

  const statusRows = [
    { key: "statusPending", meaning: "statusPendingMeaning", next: "statusPendingNext", color: "#665c00", bg: "#fff8e1" },
    { key: "statusWaitingSign", meaning: "statusWaitingSignMeaning", next: "statusWaitingSignNext", color: "#8a4b00", bg: "#fff3e0" },
    { key: "statusApproved", meaning: "statusApprovedMeaning", next: "statusApprovedNext", color: "#1b5e20", bg: "#f1f8f1" },
    { key: "statusRejected", meaning: "statusRejectedMeaning", next: "statusRejectedNext", color: colors.primaryDark, bg: colors.tint },
  ];

  const secretarySteps = ["workflowSecretaryStep1", "workflowSecretaryStep2", "workflowSecretaryStep3", "workflowSecretaryStep4"];
  const presidentSteps = ["workflowPresidentStep1", "workflowPresidentStep2", "workflowPresidentStep3"];
  const faqs = [
    { q: "faqQ1", a: "faqA1" },
    { q: "faqQ2", a: "faqA2" },
    { q: "faqQ3", a: "faqA3" },
    { q: "faqQ4", a: "faqA4" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: "0 0 4px" }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 28px" }}>{t("subtitle")}</p>

      {/* สรุปสถานะ */}
      <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{t("statusRefTitle")}</h2>
      <div style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              {[t("statusRefStatus"), t("statusRefMeaning"), t("statusRefNextAction")].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    background: "#faf5f5",
                    color: colors.textSecondary,
                    borderBottom: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statusRows.map((row) => (
              <tr key={row.key}>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                  <span style={{ background: row.bg, color: row.color, fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>
                    {t(row.key)}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{t(row.meaning)}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{t(row.next)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ขั้นตอนการทำงาน แยกตามบทบาท */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, margin: "0 0 12px", color: colors.primaryDark }}>{t("workflowSecretaryTitle")}</h3>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: colors.text, lineHeight: 1.9 }}>
            {secretarySteps.map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, margin: "0 0 12px", color: colors.primaryDark }}>{t("workflowPresidentTitle")}</h3>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: colors.text, lineHeight: 1.9 }}>
            {presidentSteps.map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* คำถามที่พบบ่อย */}
      <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{t("faqTitle")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((item) => (
          <div key={item.q} style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{t(item.q)}</div>
            <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7 }}>{t(item.a)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
