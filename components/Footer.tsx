import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";

export default async function Footer() {
  const t = await getTranslations("support");

  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px 16px",
        fontSize: 12,
        color: colors.textMuted,
      }}
    >
      {t("contactMessage")}{" "}
      <a href={`mailto:${t("contactEmail")}`} style={{ color: colors.textMuted, textDecoration: "underline" }}>
        {t("contactEmail")}
      </a>
    </div>
  );
}
