"use client";

import { useState } from "react";
import type { AgencyOptions } from "@/lib/agencies";

const AGENCY_TYPES = [
  { value: "สโมสรนักศึกษา- Student Association", label: "สโมสรนักศึกษา", sheetKey: "ฝ่ายภายในสโมสร" as const },
  { value: "ชมรม - Student Club", label: "ชมรม", sheetKey: "ชมรม" as const },
  { value: "ภาควิชา - Department", label: "ภาควิชา", sheetKey: "ภาควิชา" as const },
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
}: {
  agencyOptions: AgencyOptions;
  initialValues?: InitialValues;
}) {
  const [name, setName] = useState(initialValues?.name || "");
  const [studentId, setStudentId] = useState(initialValues?.studentId || "");
  const [email, setEmail] = useState(initialValues?.email || "");
  const [phone, setPhone] = useState(initialValues?.phone || "");
  const [docName, setDocName] = useState(initialValues?.docName || "");
  const [agencyType, setAgencyType] = useState(initialValues?.agencyType || "");
  const [agencyValue, setAgencyValue] = useState(initialValues?.agencyValue || "");
  const [previousTrackingId, setPreviousTrackingId] = useState(initialValues?.previousTrackingId || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ trackingId: string; docName: string } | null>(null);

  const selectedAgency = AGENCY_TYPES.find((a) => a.value === agencyType);
  const valueOptions = selectedAgency ? agencyOptions[selectedAgency.sheetKey] : [];

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !docName.trim()) {
      setErrorMsg("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      setStatus("error");
      return;
    }
    if (!agencyType || !agencyValue) {
      setErrorMsg("กรุณาเลือกหน่วยงานที่ยื่นเอกสารให้ครบ");
      setStatus("error");
      return;
    }
    if (!acknowledged) {
      setErrorMsg("กรุณายืนยันว่าท่านรับทราบกระบวนการ");
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMsg("กรุณาแนบไฟล์เอกสาร (PDF)");
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

    try {
      const res = await fetch("/api/submit", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาด");
        setStatus("error");
        return;
      }
      setResult(data.data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  }

  if (status === "success" && result) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: "#f1f8f1", border: "1px solid #cde5cf", borderRadius: 8, padding: 20 }}>
          <h1 style={{ fontSize: 18, color: "#1b5e20", marginBottom: 8 }}>ส่งเอกสารสำเร็จ ✅</h1>
          <p style={{ marginBottom: 12 }}>
            เอกสารเรื่อง &quot;{result.docName}&quot; ถูกส่งเข้าระบบแล้ว
          </p>
          <p style={{ background: "#fff", padding: 12, borderRadius: 6, fontSize: 14 }}>
            รหัสอ้างอิง (Tracking ID):<br />
            <strong style={{ fontSize: 18 }}>{result.trackingId}</strong>
          </p>
          <p style={{ color: "#666", fontSize: 13, marginTop: 12 }}>
            กรุณาเก็บรหัสนี้ไว้ตรวจสอบสถานะภายหลังที่หน้า{" "}
            <a href={`/status?q=${encodeURIComponent(result.trackingId)}`} style={{ color: "#2e7d32" }}>
              ตรวจสอบสถานะ
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>ยื่นเอกสาร</h1>
      <p style={{ color: "#666", marginBottom: 12, fontSize: 13 }}>
        กรอกข้อมูลและแนบไฟล์เอกสาร (PDF, ไม่เกิน 3MB)
      </p>

      {initialValues?.previousTrackingId && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 13 }}>
          กำลังยื่นแก้ไขเอกสารที่เคยถูกตีกลับ (รหัสอ้างอิงเดิม: {initialValues.previousTrackingId})
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="ชื่อ - นามสกุล *" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input placeholder="รหัสนักศึกษา" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle} />
        <input placeholder="อีเมล *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="เบอร์โทรสำหรับติดต่อ" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        <input placeholder="ชื่อเอกสาร *" value={docName} onChange={(e) => setDocName(e.target.value)} style={inputStyle} />

        <div>
          <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 6 }}>
            หน่วยงานที่ยื่นเอกสาร *
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
              {opt.label}
            </label>
          ))}
        </div>

        {selectedAgency && (
          <select value={agencyValue} onChange={(e) => setAgencyValue(e.target.value)} style={inputStyle}>
            <option value="">-- เลือก{selectedAgency.label} --</option>
            {valueOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            {valueOptions.length === 0 && <option disabled>(ไม่พบรายชื่อ ตรวจสอบแท็บ รายชื่อหน่วยงาน)</option>}
          </select>
        )}

        <input
          placeholder="รหัสอ้างอิงเดิม (ถ้าเคยถูกตีกลับและยื่นแก้ไข)"
          value={previousTrackingId}
          onChange={(e) => setPreviousTrackingId(e.target.value)}
          style={inputStyle}
        />

        <div>
          <label style={{ fontSize: 13, color: "#444", display: "block", marginBottom: 6 }}>
            ไฟล์เอกสาร (PDF) *
          </label>
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <label style={{ fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          ข้าพเจ้ารับทราบกระบวนการยื่นเอกสารและยืนยันว่าข้อมูลข้างต้นถูกต้อง
        </label>

        {status === "error" && <p style={{ color: "#b00020", fontSize: 13 }}>{errorMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          style={{
            padding: "10px 20px",
            background: status === "loading" ? "#999" : "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: status === "loading" ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          {status === "loading" ? "กำลังส่ง..." : "ส่งเอกสาร"}
        </button>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
};