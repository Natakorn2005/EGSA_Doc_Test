"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * รีเฟรชข้อมูลหน้าปัจจุบันทุก ๆ intervalMs (ไม่โหลดหน้าใหม่ทั้งหน้า ข้อมูลที่พิมพ์ค้างไว้ไม่หาย)
 * ใช้ตอนมีไฟล์ที่ "กำลังเตรียม" — พอคิวเบื้องหลังแชร์ไฟล์เสร็จ ลิงก์จะโผล่ขึ้นเอง
 * วางไว้เฉพาะตอนที่ยังมีไฟล์รออยู่ พอไม่มีแล้วหน้าจะหยุดรีเฟรชเอง
 */
export default function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
