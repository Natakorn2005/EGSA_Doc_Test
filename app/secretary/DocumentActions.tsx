"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentActions({ trackingId }: { trackingId: string }) {
  const [reviewerName, setReviewerName] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  function requireReviewer(): boolean {
    if (!reviewerName.trim()) {
      setErrorMsg("กรุณากรอกชื่อผู้ตรวจสอบก่อน");
      setStatus("error");
      return false;
    }
    return true;
  }

  async function handleAdvance() {
    if (!requireReviewer()) return;

    const confirmed = window.confirm(
      "ยืนยันส่งเรื่องให้นายกฯ? ระบบจะส่งอีเมลแจ้งนายกสโมสรฯ ทันที"
    );
    if (!confirmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, reviewerName: reviewerName.trim() }),
      });
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

  async function handleReject() {
    if (!requireReviewer()) return;
    if (!reason.trim()) {
      setErrorMsg("กรุณาระบุเหตุผลที่ตีกลับ");
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMsg("กรุณาแนบไฟล์ PDF ที่มีการทำเครื่องหมายจุดที่ต้องแก้ไข");
      setStatus("error");
      return;
    }

    const confirmed = window.confirm("ยืนยันตีกลับเอกสารนี้? ระบบจะส่งอีเมลแจ้งผู้ยื่นทันที");
    if (!confirmed) return;

    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("trackingId", trackingId);
    formData.append("reason", reason.trim());
    formData.append("reviewerName", reviewerName.trim());
    formData.append("file", file);

    try {
      const res = await fetch("/api/reject", { method: "POST", body: formData });
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
    <div style={{ marginTop: 10 }}>
      <input
        type="text"
        placeholder="ชื่อผู้ตรวจสอบ"
        value={reviewerName}
        onChange={(e) => setReviewerName(e.target.value)}
        disabled={status === "loading"}
        style={{
          padding: "6px 10px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 13,
          width: 200,
          marginBottom: 8,
          display: "block",
        }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={handleAdvance}
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
          {status === "loading" ? "กำลังส่ง..." : "ส่งให้นายกฯ"}
        </button>

        {!rejectOpen && (
          <button
            onClick={() => setRejectOpen(true)}
            disabled={status === "loading"}
            style={{
              padding: "6px 16px",
              background: "#b00020",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ตีกลับ
          </button>
        )}
      </div>

      {status === "error" && <p style={{ color: "#b00020", fontSize: 12, marginTop: 6 }}>{errorMsg}</p>}

      {rejectOpen && (
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #f0c0c0", borderRadius: 8, background: "#fff8f8" }}>
          <textarea
            placeholder="เหตุผลที่ตีกลับ"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={status === "loading"}
            style={{
              width: "100%",
              minHeight: 60,
              padding: 8,
              fontSize: 13,
              border: "1px solid #ccc",
              borderRadius: 6,
              marginBottom: 8,
              fontFamily: "inherit",
            }}
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={status === "loading"}
            style={{ marginBottom: 8, fontSize: 13, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleReject}
              disabled={status === "loading"}
              style={{
                padding: "6px 16px",
                background: status === "loading" ? "#999" : "#b00020",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: status === "loading" ? "default" : "pointer",
                fontSize: 13,
              }}
            >
              {status === "loading" ? "กำลังส่ง..." : "ยืนยันตีกลับ"}
            </button>
            <button
              onClick={() => setRejectOpen(false)}
              disabled={status === "loading"}
              style={{ padding: "6px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}