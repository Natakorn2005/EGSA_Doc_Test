import { signIn } from "@/auth";
import { getTranslations } from "next-intl/server";
import { colors, buttonPrimaryStyle } from "@/lib/theme";

export default async function LoginPage() {
  const t = await getTranslations("login");
  const tn = await getTranslations("nav");

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: 20, color: colors.text }}>{t("title")}</h1>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit" style={{ ...buttonPrimaryStyle, marginTop: 12 }}>
          {tn("signIn")}
        </button>
      </form>
    </div>
  );
}