import { getTranslations } from "next-intl/server";
import { colors } from "@/lib/theme";
import Link from "next/link";

export default async function Footer() {
  const t = await getTranslations("support");
  const tp = await getTranslations("privacy");
  const tn = await getTranslations("nav");

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
      <span style={{ margin: "0 8px" }}>·</span>
      <Link href="/privacy" style={{ color: colors.textMuted, textDecoration: "underline" }}>
        {tp("navLabel")}
      </Link>
      <span style={{ margin: "0 8px" }}>·</span>
      <Link href="/guide" style={{ color: colors.textMuted, textDecoration: "underline" }}>
        {tn("guide")}
      </Link>
    </div>
  );
}
