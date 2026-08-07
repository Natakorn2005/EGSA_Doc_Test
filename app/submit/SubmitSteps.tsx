"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  heroStyle,
  cardStyle,
  tileStyle,
  iconBoxStyle,
  buttonPrimaryStyle,
  colors,
  layout,
} from "@/lib/theme";

export default function SubmitSteps({ onContinue }: { onContinue: () => void }) {
  const t = useTranslations("submitSteps");

  const steps = [
    { icon: "ti-file-upload", title: t("step1Title"), desc: t("step1Desc") },
    { icon: "ti-user-check", title: t("step2Title"), desc: t("step2Desc") },
    { icon: "ti-signature", title: t("step3Title"), desc: t("step3Desc") },
    { icon: "ti-mail-check", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto" }}>
      <div style={{ ...heroStyle, color: "#fff", marginBottom: 20 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            fontFamily: "var(--font-heading)",
          }}
        >
          {t("title")}
        </div>
        <div style={{ marginTop: 6, opacity: 0.9, fontSize: 14 }}>
          {t("subtitle")}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((s, i) => (
          <div key={i} style={tileStyle}>
            <div style={iconBoxStyle}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {i + 1}. {s.title}
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          ...cardStyle,
          background: colors.tint,
          borderColor: colors.tintBorder,
          marginTop: 12,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <i
          className="ti ti-alert-circle"
          style={{ color: colors.primary, fontSize: 18, marginTop: 2 }}
        />
        <div style={{ fontSize: 13, color: colors.text }}>
          {t("rejectNote")}
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            textDecoration: "none",
          }}
        >
          ← {t("backHome")}
        </Link>
        <button style={buttonPrimaryStyle} onClick={onContinue}>
          {t("continueButton")}
        </button>
      </div>
    </div>
  );
}