"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdvanceButton({ trackingId }: { trackingId: string }) {
  const [reviewerName, setReviewerName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleClick() {
    if (!reviewerName.trim()) {
      setErrorMsg("กรุณากรอกชื่อผู้ตรวจสอบก่อน");
      setStatus("error");
      return;
    }

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

      // Row will vanish from the queue on refresh since its status changed —
      // that disappearance IS the success confirmation, no separate banner needed.
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="ชื่อผู้ตรวจสอบ"
        value={reviewerName}
        onChange={(e) => setReviewerName(e.target.value)}
        disabled={status === "loading"}
        style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: 13 }}
      />
      <button
        onClick={handleClick}
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
      {status === "error" && <span style={{ color: "#b00020", fontSize: 12 }}>{errorMsg}</span>}
    </div>
  );
}