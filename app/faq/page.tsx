import { getTranslations } from "next-intl/server";
import { colors, cardStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const t = await getTranslations("faq");

  const items = ["q1", "q2", "q3", "q4", "q5", "q6"];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 13, margin: "0 0 24px" }}>{t("subtitle")}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((key) => (
          <div key={key} style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: colors.primaryDark }}>
              {t(key)}
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7 }}>
              {t(`a${key.slice(1)}`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
