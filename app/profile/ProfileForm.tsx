"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [name, setName] = useState(initialName);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleSave() {
    if (!name.trim()) {
      setErrorMsg("กรุณากรอกชื่อ - นามสกุล");
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
        setErrorMsg(data.error || "เกิดข้อผิดพลาด");
        setStatus("error");
        return;
      }
      // บันทึกสำเร็จ -> กลับไปหน้าแรกทันที (หน้าแรกจะเช็คโปรไฟล์ใหม่และแสดงหน้ายินดีต้อนรับแทนการเด้งกลับมาที่นี่)
      router.push("/");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>ข้อมูลส่วนตัว</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 13 }}>
        {hasSavedProfile
          ? "แก้ไขข้อมูลที่ใช้เติมฟอร์มยื่นเอกสารอัตโนมัติ"
          : "บันทึกครั้งแรก — ระบบจะเติมข้อมูลนี้ให้อัตโนมัติทุกครั้งที่ยื่นเอกสารในอนาคต"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>อีเมล</label>
          <input value={email} disabled style={{ ...inputStyle, background: "#f5f5f5", color: "#888" }} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>ชื่อ - นามสกุล *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={status === "loading"} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>รหัสนักศึกษา</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={status === "loading"} style={inputStyle} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>เบอร์โทรสำหรับติดต่อ</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={status === "loading"} style={inputStyle} />
        </div>

        {status === "error" && <p style={{ color: "#b00020", fontSize: 13 }}>{errorMsg}</p>}

        <button
          onClick={handleSave}
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
          {status === "loading" ? "กำลังบันทึก..." : "บันทึกและกลับหน้าแรก"}
        </button>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};