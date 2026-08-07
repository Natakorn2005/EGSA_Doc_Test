"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { colors, heroStyle, cardStyle, iconBoxStyle } from "@/lib/theme";
import type { AgencyOptions } from "@/lib/agencies";
import SubmitForm from "./SubmitForm";

type InitialValues = {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  docName: string;
  agencyType: string;
  agencyValue: string;
  previousTrackingId: string;
};

export default function SubmitFlow({
  agencyOptions,
  initialValues,
  isLoggedIn,
}: {
  agencyOptions: AgencyOptions;
  initialValues?: InitialValues;
  isLoggedIn?: boolean;
}) {
  const t = useTranslations("submitSteps");
  const [stage, setStage] = useState<"steps" | "form">("steps");

  if (stage === "form") {
    return <SubmitForm agencyOptions={agencyOptions} initialValues={initialValues} isLoggedIn={isLoggedIn} />;
  }

  const steps = [
    { icon: "ti-file-plus", titleKey: "step1Title", descKey: "step1Desc" },
    { icon: "ti-user-check", titleKey: "step2Title", descKey: "step2Desc" },
    { icon: "ti-signature", titleKey: "step3Title", descKey: "step3Desc" },
    { icon: "ti-mail-check", titleKey: "step4Title", descKey: "step4Desc" },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px" }}>
      <div style={heroStyle}>
        <h1 style={{ color: "#fff", fontSize: 20, margin: "0 0 6px" }}>{t("title")}</h1>
        <p style={{ color: "#F3D0D4", fontSize: 13, margin: 0 }}>{t("subtitle")}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "20px 0" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={iconBoxStyle}>
              <i className={`ti ${step.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {i + 1}. {t(step.titleKey)}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{t(step.descKey)}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          background: colors.tint,
          border: `1px solid ${colors.tintBorder}`,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 24,
        }}
      >
        <i className="ti ti-alert-circle" style={{ fontSize: 18, color: colors.primaryDark, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
        <p style={{ fontSize: 13, color: colors.primaryDark, margin: 0 }}>{t("rejectNote")}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ color: colors.textSecondary, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
          {t("backHome")}
        </a>
        <button
          onClick={() => setStage("form")}
          style={{
            padding: "11px 22px",
            background: colors.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "var(--font-body)",
          }}
        >
          {t("continueButton")}
        </button>
      </div>
    </div>
  );
}