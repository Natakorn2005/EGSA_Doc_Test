"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import type { AgencyOptions } from "@/lib/agencies";
import { colors, inputStyle, buttonPrimaryStyle } from "@/lib/theme";

const AGENCY_TYPES = [
  { value: "สโมสรนักศึกษา- Student Association", labelKey: "agencyStudentUnion", sheetKey: "ฝ่ายภายในสโมสร" as const },
  { value: "ชมรม - Student Club", labelKey: "agencyClub", sheetKey: "ชมรม" as const },
  { value: "ภาควิชา - Department", labelKey: "agencyDepartment", sheetKey: "ภาควิชา" as const },
];

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

export default function SubmitForm({
  agencyOptions,
  initialValues,
  isLoggedIn,
}: {
  agencyOptions: AgencyOptions;
  initialValues?: InitialValues;
  isLoggedIn?: boolean;
}) {
  const t = useTranslations("submit");
  const [name, setName] = useState(initialValues?.name || "");
  const [studentId, setStudentId] = useState(initialValues?.studentId || "");
  const [email, setEmail] = useState(initialValues?.email || "");
  const [phone, setPhone] = useState(initialValues?.phone || "");
  const [docName, setDocName] = useState(initialValues?.docName || "");
  const [agencyType, setAgencyType] = useState(initialValues?.agencyType || "");
  const [agencyValue, setAgencyValue] = useState(initialValues?.agencyValue || "");
  const [previousTrackingId, setPreviousTrackingId] = useState(initialValues?.previousTrackingId || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ trackingId: string; docName: string } | null>(null);

  const selectedAgency = AGENCY_TYPES.find((a) => a.value === agencyType);
  const valueOptions = selectedAgency ? agencyOptions[selectedAgency.sheetKey] : [];

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !docName.trim()) {
      setErrorMsg(t("errMissingRequired"));
      setStatus("error");
      return;
    }
    if (!agencyType || !agencyValue) {
      setErrorMsg(t("errMissingAgency"));
      setStatus("error");
      return;
    }
    if (!acknowledged) {
      setErrorMsg(t("errNotAcknowledged"));
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMsg(t("errMissingFile"));
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("studentId", studentId.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("docName", docName.trim());
    formData.append("agencyType", agencyType);
    formData.append("agencyValue", agencyValue);
    formData.append("previousTrackingId", previousTrackingId.trim());
    formData.append("acknowledged", "true");
    formData.append("file", file);
    // *** Honeypot — ส่งค่าว่างเสมอสำหรับผู้ใช้จริง (ช่องนี้ซ่อนอยู่ คนมองไม่เห็น) ***
    formData.append("website", honeypot);

    try {
      const res = await fetch("/api/submit", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "");
        setStatus("error");
        return;
      }
      setResult(data.data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "");
      setStatus("error");
    }
  }

  if (status === "success" && result) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ background: colors.tint, border: `1px solid ${colors.tintBorder}`, borderRadius: 12, padding: 20 }}>
          <h1 style={{ fontSize: 18, color: colors.primaryDark, marginBottom: 8 }}>{t("successTitle")}</h1>
          <p style={{ marginBottom: 12 }}>{t("successBody", { docName: result.docName })}</p>
          <p style={{ background: "#fff", padding: 12, borderRadius: 6, fontSize: 14 }}>
            {t("trackingIdLabel")}
            <br />
            <strong style={{ fontSize: 18 }}>{result.trackingId}</strong>
          </p>
          <p style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>
            {t("keepTrackingId")}{" "}
            <a href={`/status?q=${encodeURIComponent(result.trackingId)}`} style={{ color: colors.primary }}>
              {t("statusLink")}
            </a>
            {isLoggedIn && (
              <>
                {" "}
                {t("orSeeAll")}{" "}
                <a href="/my" style={{ color: colors.primary }}>
                  {t("myDocsLink")}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, marginBottom: 12, fontSize: 13 }}>{t("subtitle")}</p>

      {initialValues?.previousTrackingId && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 13 }}>
          {t("resubmitBanner", { id: initialValues.previousTrackingId })}
        </div>
      )}

      {!initialValues?.previousTrackingId && isLoggedIn && (
        <div style={{ background: colors.tint, border: `1px solid ${colors.tintBorder}`, borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 13 }}>
          {t("autofillBanner")}
        </div>
      )}

      {!initialValues?.previousTrackingId && !isLoggedIn && (
        <div style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 12, color: colors.textSecondary }}>
          {t("loginHintBanner")}{" "}
          <a href="/my" style={{ color: colors.primary }}>
            {t("myDocsLink")}
          </a>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* *** Honeypot — ซ่อนจากสายตาและจาก screen reader คนจริงไม่มีทางกรอก ***
            บอทที่กรอกทุกช่องอัตโนมัติจะติดกับ แล้วถูกปฏิเสธเงียบ ๆ ฝั่ง API */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        />

        <input placeholder={t("nameLabel")} value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />
        <input placeholder={t("studentIdLabel")} value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />
        <input placeholder={t("emailLabel")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />
        <input placeholder={t("phoneLabel")} value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />
        <input placeholder={t("docNameLabel")} value={docName} onChange={(e) => setDocName(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />

        <div>
          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("agencyLabel")}
          </label>
          {AGENCY_TYPES.map((opt) => (
            <label key={opt.value} style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
              <input
                type="radio"
                name="agencyType"
                checked={agencyType === opt.value}
                onChange={() => {
                  setAgencyType(opt.value);
                  setAgencyValue("");
                }}
                style={{ marginRight: 6 }}
              />
              {t(opt.labelKey)}
            </label>
          ))}
        </div>

        {selectedAgency && (
          <select
            value={agencyValue}
            onChange={(e) => setAgencyValue(e.target.value)}
            style={{ ...inputStyle, boxSizing: "border-box" }}
          >
            <option value="">
              {t("selectPrefix")}
              {t(selectedAgency.labelKey)} --
            </option>
            {valueOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            {valueOptions.length === 0 && <option disabled>{t("noAgencyList")}</option>}
          </select>
        )}

        <input
          placeholder={t("previousTrackingLabel")}
          value={previousTrackingId}
          onChange={(e) => setPreviousTrackingId(e.target.value)}
          style={{ ...inputStyle, boxSizing: "border-box" }}
        />

        <div>
          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {t("fileLabel")}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              border: `1px dashed ${colors.tintBorder}`,
              borderRadius: 8,
              cursor: "pointer",
              background: colors.tint,
            }}
          >
            <i className="ti ti-upload" style={{ fontSize: 18, color: colors.primary }} aria-hidden="true" />
            <span
              style={{
                fontSize: 13,
                color: file ? colors.primaryDark : colors.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file ? file.name : t("chooseFilePlaceholder")}
            </span>
          </div>
          <p style={{ fontSize: 11, color: colors.textMuted, margin: "6px 0 0" }}>{t("fileHint")}</p>
        </div>

        <label style={{ fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          {t("acknowledgeLabel")}
        </label>

        {status === "error" && <p style={{ color: "#b00020", fontSize: 13 }}>{errorMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          style={{ ...buttonPrimaryStyle, opacity: status === "loading" ? 0.7 : 1 }}
        >
          {status === "loading" ? t("sending") : t("submitButton")}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: colors.textMuted, margin: 0 }}>
          {t("needHelp")}{" "}
          <a href="/faq" style={{ color: colors.primary }}>
            {t("needHelpLink")}
          </a>
        </p>
      </div>
    </div>
  );
}