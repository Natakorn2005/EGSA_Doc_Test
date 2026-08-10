import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";

export default async function UnauthorizedPage() {
  const t = await getTranslations("unauthorized");

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: 20, color: colors.text }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary }}>{t("body")}</p>
    </div>
  );
}