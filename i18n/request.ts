import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "th";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const stored = cookieStore.get("locale")?.value;
  const locale: Locale = locales.includes(stored as Locale) ? (stored as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
