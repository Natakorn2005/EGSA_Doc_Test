import { getTranslations } from "next-intl/server";
import { colors, cardStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const section1Items = [1, 2, 3, 4, 5].map((n) => t(`section1Item${n}`));
  const section3Items = [1, 2, 3, 4, 5, 6].map((n) => t(`section3Item${n}`));

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 16px" }}>{t("title")}</h1>

      <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.8, marginBottom: 20 }}>
        {t("intro")}
      </p>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("section1Title")}</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: colors.textSecondary, lineHeight: 1.9 }}>
          {section1Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("section2Title")}</div>
        <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.9, margin: 0 }}>{t("section2Body")}</p>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("section3Title")}</div>
        <ol style={{ margin: "0 0 12px", paddingLeft: 20, fontSize: 13, color: colors.textSecondary, lineHeight: 1.9 }}>
          {section3Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
        <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.9, margin: 0 }}>{t("section3Footer")}</p>
      </div>

      <div style={{ ...cardStyle, marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("section4Title")}</div>
        <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.9, margin: 0 }}>{t("section4Body")}</p>
      </div>

      <div style={{ ...cardStyle, marginTop: 10, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("section5Title")}</div>
        <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.9, margin: 0 }}>{t("section5Body")}</p>
      </div>

      <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
        <a href={t("referenceUrl")} target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted }}>
          {t("referenceText")}
        </a>
      </p>
    </div>
  );
}
