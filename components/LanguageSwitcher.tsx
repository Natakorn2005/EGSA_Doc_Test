"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/lib/actions";
import { colors } from "@/lib/theme";

export default function LanguageSwitcher({ variant = "onDark" }: { variant?: "onDark" | "onLight" }) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = locale === "th" ? "en" : "th";
    startTransition(() => {
      setLocale(next);
    });
  }

  const style =
    variant === "onLight"
      ? {
          background: colors.primary,
          color: "#fff",
          boxShadow: "0 2px 8px rgba(110,20,35,0.25)",
        }
      : {
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
        };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        border: "none",
        borderRadius: 20,
        cursor: pending ? "default" : "pointer",
        fontSize: 12,
        fontFamily: "var(--font-body)",
        ...style,
      }}
    >
      <i className="ti ti-language" style={{ fontSize: 14 }} aria-hidden="true" />
      {locale === "th" ? "EN" : "ไทย"}
    </button>
  );
}