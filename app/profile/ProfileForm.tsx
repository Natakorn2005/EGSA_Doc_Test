"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { colors, inputStyle } from "@/lib/theme";

export default function ProfileForm({
  email,
  initialName,
  initialStudentId,
  initialPhone,
  hasSavedProfile,
}: {
  email: string;
  initialName: string;
  initialStudentId: string;
  initialPhone: string;
  hasSavedProfile: boolean;
}) {
  const t = useTranslations("profile");
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleSave() {
    if (!name.trim()) {
      setErrorMsg(t("errMissingName"));
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), studentId: studentId.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "");
        setStatus("error");
        return;
      }
      router.push("/");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "");
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ background: colors.primary, padding: "16px 20px" }}>
          <h1 style={{ color: "#fff", fontSize: 17, margin: 0 }}>{t("title")}</h1>
          <p style={{ color: "#F3D0D4", fontSize: 12, margin: "4px 0 0" }}>
            {hasSavedProfile ? t("editSubtitle") : t("firstTimeSubtitle")}
          </p>
        </div>

        <div style={{ padding: 20 }}>
          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("emailLabel")}
          </label>
          <input
            value={email}
            disabled
            style={{ ...inputStyle, width: "100%", background: "#f5f5f5", color: colors.textMuted, marginBottom: 14, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("nameLabel")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "loading"}
            style={{ ...inputStyle, width: "100%", marginBottom: 14, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("studentIdLabel")}
          </label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={status === "loading"}
            style={{ ...inputStyle, width: "100%", marginBottom: 14, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("phoneLabel")}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={status === "loading"}
            style={{ ...inputStyle, width: "100%", marginBottom: 18, boxSizing: "border-box" }}
          />

          {status === "error" && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 14px" }}>{errorMsg}</p>}

          <button
            onClick={handleSave}
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: status === "loading" ? "#999" : colors.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: status === "loading" ? "default" : "pointer",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          >
            {status === "loading" ? t("saving") : t("saveButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
