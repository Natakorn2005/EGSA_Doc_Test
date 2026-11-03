"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSendQueue, useSendJob } from "@/components/SendQueue";
import type { AgencyOptions } from "@/lib/agencies";
import { colors, inputStyle, buttonPrimaryStyle } from "@/lib/theme";

// sheetKey = null หมายถึงหมวด "อื่น ๆ" ที่ให้พิมพ์ชื่อหน่วยงานเอง ไม่มีรายการให้เลือก
const AGENCY_TYPES = [
  { value: "สโมสรนักศึกษา- Student Association", labelKey: "agencyStudentUnion", sheetKey: "ฝ่ายภายในสโมสร" as const },
  { value: "ชมรม - Student Club", labelKey: "agencyClub", sheetKey: "ชมรม" as const },
  { value: "ภาควิชา - Department", labelKey: "agencyDepartment", sheetKey: "ภาควิชา" as const },
  { value: "อื่น ๆ - Other", labelKey: "agencyOther", sheetKey: null },
];

// ค่าที่ใช้ระบุว่าเลือกหมวด "อื่น ๆ" — ใช้ร่วมกันทั้งฝั่งเว็บแอปและ Apps Script
const AGENCY_OTHER_VALUE = "อื่น ๆ - Other";

/**
 * แปลงค่าหน่วยงานที่มากับลิงก์ยื่นแก้ไข ให้ตรงกับตัวเลือกของเว็บแอป
 *
 * เอกสารที่ยื่นผ่าน Google Form เก็บค่าแบบฟอร์ม เช่น "สโมสรนักศึกษา - Student Association" (มีเว้นวรรค)
 * ซึ่งไม่ตรงกับค่าของเว็บแอป ("สโมสรนักศึกษา- Student Association") จึงเทียบแบบไม่สนเว้นวรรค
 * ถ้าไม่ตรงตัวเลือกไหนเลย แปลว่าเป็นชื่อที่ผู้ยื่นพิมพ์เองในช่อง "อื่น ๆ" ของฟอร์ม (ข้อมูลเก่า)
 */
function normalizeInitialAgency(rawType: string, rawValue: string): { type: string; value: string } {
  const type = (rawType || "").trim();
  const value = (rawValue || "").trim();
  if (!type) return { type: "", value };
  const key = type.replace(/\s+/g, "");
  const match = AGENCY_TYPES.find((a) => a.value.replace(/\s+/g, "") === key);
  if (match) return { type: match.value, value };
  // ข้อมูลเก่าจาก Google Form: ชื่อหน่วยงานที่พิมพ์เองอยู่ในช่องประเภทหน่วยงาน
  const usableValue = value && value !== "ไม่ระบุหน่วยงาน" ? value : type;
  return { type: AGENCY_OTHER_VALUE, value: usableValue };
}

// ---- Entry ID ของแต่ละช่องในฟอร์มยื่นเอกสาร (Google Form) ----
// ใช้สร้างลิงก์ที่กรอกข้อมูลไว้ล่วงหน้า ตอนไฟล์ใหญ่เกินขีดจำกัดของเว็บแอป
// *** ถ้าสร้างฟอร์มใหม่ Entry ID จะเปลี่ยนทั้งหมด ต้องหามาใส่ใหม่ (ดูวิธีในคู่มือส่วนที่ 19.5) ***
const FORM_ENTRY = {
  name: "496970711",
  studentId: "1786944811",
  email: "1426659741",
  phone: "593319885",
  docName: "1025524505",
  prevTrackingId: "1642743242",
  agencyType: "476213347",
  division: "866812361", // ฝ่ายภายในสโมสร
  club: "1694640136",    // ชมรม
  dept: "1870349516",    // ภาควิชา
};

// *** ค่าตัวเลือกหน่วยงานในเว็บแอปสะกดไม่ตรงกับในฟอร์มเป๊ะ ***
// เว็บแอป: "สโมสรนักศึกษา- Student Association" (ไม่มีเว้นวรรคหน้าขีด)
// ฟอร์ม  : "สโมสรนักศึกษา - Student Association" (มีเว้นวรรค)
// ถ้าส่งค่าไม่ตรง ฟอร์มจะไม่เลือกตัวเลือกให้ จึงต้องแมปก่อนเสมอ
const AGENCY_TYPE_FORM_VALUE: Record<string, string> = {
  "สโมสรนักศึกษา- Student Association": "สโมสรนักศึกษา - Student Association",
  "ชมรม - Student Club": "ชมรม - Student Club",
  "ภาควิชา - Department": "ภาควิชา - Department",
};

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
  const initialAgency = normalizeInitialAgency(initialValues?.agencyType || "", initialValues?.agencyValue || "");
  const [agencyType, setAgencyType] = useState(initialAgency.type);
  const [agencyValue, setAgencyValue] = useState(initialAgency.value);
  const [previousTrackingId, setPreviousTrackingId] = useState(initialValues?.previousTrackingId || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileTooLarge, setFileTooLarge] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // *** ส่งผ่านคิวเบื้องหลัง (components/SendQueue.tsx) ***
  // ผู้ใช้เปลี่ยนไปหน้าอื่นในเว็บระหว่างส่งได้ ผลจะแจ้งเป็นกล่องแจ้งเตือนที่มุมจอ
  // ถ้ายังอยู่หน้านี้ตอนส่งเสร็จ หน้านี้จะแสดงผลเอง (ไม่เด้งกล่องแจ้งเตือนซ้ำ)
  const { enqueue, dismiss } = useSendQueue();
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useSendJob(jobId);
  const result =
    job?.status === "done" && job.result?.trackingId
      ? { trackingId: job.result.trackingId, docName: job.result.docName || job.label }
      : null;

  // ส่งไม่สำเร็จขณะยังอยู่หน้านี้: แสดงฟอร์มเดิม (ข้อมูลที่กรอกยังอยู่ครบ) พร้อมสาเหตุ
  const shownError =
    job?.status === "error" ? job.error || t("errGeneric") : status === "error" ? errorMsg : "";

  const selectedAgency = AGENCY_TYPES.find((a) => a.value === agencyType);
  const valueOptions = selectedAgency?.sheetKey ? agencyOptions[selectedAgency.sheetKey] : [];
  const isOtherAgency = agencyType === AGENCY_OTHER_VALUE;

  /**
   * สร้างลิงก์ Google Form ที่กรอกข้อมูลที่ผู้ใช้พิมพ์ไว้แล้วให้ล่วงหน้า
   * ใช้ตอนไฟล์ใหญ่เกินขีดจำกัดของเว็บแอป จะได้ไม่ต้องกรอกใหม่ทั้งหมด
   *
   * หมายเหตุ: ช่องแนบไฟล์กับช่องติ๊กยินยอม กรอกล่วงหน้าให้ไม่ได้
   * — ไฟล์เพราะ Google ไม่รองรับ, ยินยอมเพราะควรเป็นการกระทำโดยเจตนาของผู้ใช้เอง
   */
  function buildPrefilledFormUrl(): string {
    const base = t("googleFormUrl");
    // ถ้ายังไม่ได้ตั้งลิงก์ไว้ ให้คืนค่าเดิมไปเลย กันลิงก์เพี้ยน
    if (!base || base.startsWith("REPLACE_ME")) return base;

    const params: [string, string][] = [];
    const add = (entryId: string, value: string) => {
      if (value && value.trim()) params.push([`entry.${entryId}`, value.trim()]);
    };

    add(FORM_ENTRY.name, name);
    add(FORM_ENTRY.studentId, studentId);
    add(FORM_ENTRY.email, email);
    add(FORM_ENTRY.phone, phone);
    add(FORM_ENTRY.docName, docName);
    add(FORM_ENTRY.prevTrackingId, previousTrackingId);

    if (agencyType) {
      if (isOtherAgency) {
        // *** หมวด "อื่น ๆ" ใช้ Option Other ของ Google Form ***
        // ต้องใช้ไวยากรณ์พิเศษ 2 บรรทัด: ตัวเลือกเป็น __other_option__ แล้วส่งข้อความจริงแยกอีกพารามิเตอร์
        add(FORM_ENTRY.agencyType, "__other_option__");
        add(`${FORM_ENTRY.agencyType}.other_option_response`, agencyValue);
      } else {
        add(FORM_ENTRY.agencyType, AGENCY_TYPE_FORM_VALUE[agencyType] || agencyType);

        // *** ใส่เฉพาะช่องหน่วยงานย่อยที่ตรงกับประเภทที่เลือกเท่านั้น ***
        // ฟอร์มใช้ "Go to section based on answer" — ถ้าใส่ทั้งสามช่องพร้อมกันจะพาไปหน้าผิด
        if (selectedAgency?.sheetKey === "ฝ่ายภายในสโมสร") add(FORM_ENTRY.division, agencyValue);
        else if (selectedAgency?.sheetKey === "ชมรม") add(FORM_ENTRY.club, agencyValue);
        else if (selectedAgency?.sheetKey === "ภาควิชา") add(FORM_ENTRY.dept, agencyValue);
      }
    }

    if (params.length === 0) return base;

    const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const joiner = base.includes("?") ? "&" : "?usp=pp_url&";
    return `${base}${joiner}${query}`;
  }

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
    if (!pdpaConsent) {
      setErrorMsg(t("errNoPdpaConsent"));
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMsg(t("errMissingFile"));
      setStatus("error");
      return;
    }

    setErrorMsg("");
    if (jobId) dismiss(jobId); // ล้างผลการส่งครั้งก่อนที่ไม่สำเร็จ

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
    formData.append("pdpaConsent", "true");
    formData.append("file", file);
    // *** Honeypot — ส่งค่าว่างเสมอสำหรับผู้ใช้จริง (ช่องนี้ซ่อนอยู่ คนมองไม่เห็น) ***
    formData.append("website", honeypot);

    setStatus("idle");
    setJobId(
      enqueue({
        kind: "submit",
        label: docName.trim(),
        request: { endpoint: "/api/submit", body: formData },
      })
    );
    window.scrollTo({ top: 0 });
  }

  if (job?.status === "sending") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ background: colors.tint, border: `1px solid ${colors.tintBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className="egsa-spinner egsa-spinner-dark" aria-hidden="true" />
            <h1 style={{ fontSize: 18, color: colors.primaryDark, margin: 0 }}>{t("sendingTitle")}</h1>
          </div>
          <p style={{ margin: "0 0 12px", overflowWrap: "anywhere" }}>{t("sendingBody", { docName: job.label })}</p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              padding: "9px 12px",
              background: "#fff",
              borderRadius: 6,
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            <i className="ti ti-info-circle" style={{ fontSize: 15, color: colors.primary, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
            <span>{t("sendingHint")}</span>
          </div>
          <p style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
            <Link href="/" style={{ color: colors.primary }}>
              {t("sendingGoHome")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (result) {
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

          {/* แจ้งระยะเวลาดำเนินการตรงจังหวะที่ผู้ยื่นเริ่มรอจริง ๆ */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              marginTop: 12,
              padding: "9px 12px",
              background: "#fff",
              borderRadius: 6,
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            <i
              className="ti ti-clock"
              style={{ fontSize: 15, color: colors.primary, marginTop: 1, flexShrink: 0 }}
              aria-hidden="true"
            />
            <span>{t("processingTimeNote")}</span>
          </div>

          {/* อีเมลยืนยันส่งจากคิวเบื้องหลัง อาจมาช้ากว่าหน้านี้ 1–2 นาที — บอกไว้กันคนยื่นซ้ำ */}
          <p style={{ fontSize: 12, color: colors.textSecondary, margin: "10px 0 0", lineHeight: 1.6 }}>
            {t("confirmEmailNote")}
          </p>

          <p style={{ color: colors.textSecondary, fontSize: 13, marginTop: 12 }}>
            {t("keepTrackingId")}{" "}
            <Link href={`/status?q=${encodeURIComponent(result.trackingId)}`} style={{ color: colors.primary }}>
              {t("statusLink")}
            </Link>
            {isLoggedIn && (
              <>
                {" "}
                {t("orSeeAll")}{" "}
                <Link href="/my" style={{ color: colors.primary }}>
                  {t("myDocsLink")}
                </Link>
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
          <Link href="/my" style={{ color: colors.primary }}>
            {t("myDocsLink")}
          </Link>
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
        <div style={{ width: "100%" }}>
          <input
            placeholder={t("emailLabel")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, boxSizing: "border-box", width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              padding: "5px 10px",
              background: colors.tint,
              borderRadius: 8,
              fontSize: 11,
              color: colors.primaryDark,
              lineHeight: 1.5,
            }}
          >
            <i className="ti ti-mail" style={{ fontSize: 13, flexShrink: 0 }} aria-hidden="true" />
            {t("emailDomainHint")}
          </div>
          {isLoggedIn &&
            initialValues?.email &&
            email.trim() !== "" &&
            email.trim().toLowerCase() !== initialValues.email.trim().toLowerCase() && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  marginTop: 6,
                  padding: "6px 10px",
                  background: "#fff8e1",
                  border: "1px solid #ffe082",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#8a6d00",
                }}
              >
                <i className="ti ti-alert-triangle" style={{ fontSize: 13, marginTop: 1 }} aria-hidden="true" />
                {t("emailMismatchWarning")}
              </div>
            )}
        </div>
        <input placeholder={t("phoneLabel")} value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, boxSizing: "border-box" }} />
        <div style={{ width: "100%" }}>
          <input
            placeholder={t("docNameLabel")}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            style={{ ...inputStyle, boxSizing: "border-box", width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginTop: 6,
              padding: "6px 10px",
              background: colors.tint,
              borderRadius: 8,
              fontSize: 11,
              color: colors.primaryDark,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <i className="ti ti-bulb" style={{ fontSize: 13 }} aria-hidden="true" />
              {t("docNameHintInstruction")}
            </div>
            <div style={{ color: colors.textSecondary, paddingLeft: 18 }}>{t("docNameHintExample")}</div>
          </div>
        </div>

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

        {isOtherAgency && (
          <input
            placeholder={t("agencyOtherPlaceholder")}
            value={agencyValue}
            onChange={(e) => setAgencyValue(e.target.value)}
            style={{ ...inputStyle, boxSizing: "border-box" }}
          />
        )}

        {selectedAgency?.sheetKey && (
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
            onChange={(e) => {
              const picked = e.target.files?.[0] || null;
              // *** เช็คขนาดทันทีที่เลือกไฟล์ ไม่ต้องรออัปโหลดจนสุดแล้วค่อยโดนปฏิเสธ ***
              const MAX_SIZE = 3 * 1024 * 1024;
              if (picked && picked.size > MAX_SIZE) {
                setFile(null);
                setFileTooLarge(true);
                if (fileRef.current) fileRef.current.value = "";
                return;
              }
              setFileTooLarge(false);
              setFile(picked);
            }}
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

          {/* *** ไฟล์ใหญ่เกิน — เสนอทางเลือกยื่นผ่าน Google Form แทน ***
              Google Form อัปไฟล์เข้า Drive โดยตรง ไม่ผ่าน Vercel จึงรับไฟล์ใหญ่กว่าได้ */}
          {fileTooLarge && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                background: "#fff8e1",
                border: "1px solid #ffe082",
                borderRadius: 8,
                fontSize: 12,
                color: "#8a6d00",
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 14, marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                <span>{t("fileTooLargeMessage")}</span>
              </div>
              <a
                href={buildPrefilledFormUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: colors.primary,
                  color: "#fff",
                  borderRadius: 7,
                  textDecoration: "none",
                  fontSize: 12,
                }}
              >
                <i className="ti ti-external-link" style={{ fontSize: 14 }} aria-hidden="true" />
                {t("fileTooLargeFormButton")}
              </a>
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
                {t("fileTooLargePrefillNote")}
              </div>
            </div>
          )}
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

        <label style={{ fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <input
            type="checkbox"
            checked={pdpaConsent}
            onChange={(e) => setPdpaConsent(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            {t("pdpaConsentLabel")}{" "}
            <a href="/privacy" target="_blank" style={{ color: colors.primary }}>
              {t("pdpaConsentLink")}
            </a>
          </span>
        </label>

        {shownError && <p style={{ color: "#b00020", fontSize: 13 }}>{shownError}</p>}

        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          style={{ ...buttonPrimaryStyle, opacity: status === "loading" ? 0.7 : 1 }}
        >
          {status === "loading" ? t("sending") : t("submitButton")}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: colors.textMuted, margin: 0 }}>
          {t("needHelp")}{" "}
          <Link href="/faq" style={{ color: colors.primary }}>
            {t("needHelpLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
