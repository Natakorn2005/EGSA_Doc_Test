"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SignerOption } from "@/lib/roles";

export default function ApproveAction({
  trackingId,
  approverOptions,
}: {
  trackingId: string;
  approverOptions: SignerOption[];
}) {
  const [approverName, setApproverName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!approverName.trim()) {
      setErrorMsg("กรุณาเลือกผู้เซ็นอนุมัติ");
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMsg("กรุณาแนบไฟล์ PDF ที่เซ็นแล้ว");
      setStatus("error");
      return;
    }

    const confirmed = window.confirm(
      "ยืนยันอนุมัติเอกสารนี้? ระบบจะออกเลขเอกสารและส่งอีเมลแจ้งผู้ยื่นทันที"
    );
    if (!confirmed) return;

    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("trackingId", trackingId);
    formData.append("approverName", approverName.trim());
    formData.append("file", file);

    try {
      const res = await fetch("/api/approve", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาด");
        setStatus("error");
        return;
      }
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  }

  return (
    <div style={{ marginTop: 10, padding: 12, border: "1px solid #cde5cf", borderRadius: 8, background: "#f6fbf6" }}>
      <select
        value={approverName}
        onChange={(e) => setApproverName(e.target.value)}
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: 6,
          fontSize: 13,
          border: "1px solid #ccc",
          borderRadius: 6,
          marginBottom: 8,
        }}
      >
        <option value="">-- เลือกผู้เซ็นอนุมัติ --</option>
        {approverOptions.map((opt) => (
          <option key={opt.name} value={opt.name}>
            {opt.name}
            {opt.roleLabel ? ` (${opt.roleLabel})` : ""}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={status === "loading"}
        style={{ marginBottom: 8, fontSize: 13, display: "block" }}
      />

      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        style={{
          padding: "6px 16px",
          background: status === "loading" ? "#999" : "#2e7d32",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: status === "loading" ? "default" : "pointer",
          fontSize: 13,
        }}
      >
        {status === "loading" ? "กำลังส่ง..." : "อนุมัติและออกเลขเอกสาร"}
      </button>

      {status === "error" && <p style={{ color: "#b00020", fontSize: 12, marginTop: 6 }}>{errorMsg}</p>}
    </div>
  );
}