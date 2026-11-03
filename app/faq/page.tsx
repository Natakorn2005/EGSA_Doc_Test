import { getTranslations } from "next-intl/server";
import { colors, cardStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

// จำนวนคำถามสูงสุดที่จะลองมองหา — ตั้งเผื่อไว้มากพอ ไม่ต้องแก้ตอนเพิ่มคำถามใหม่
const MAX_FAQ_ITEMS = 30;

export default async function FaqPage() {
  const t = await getTranslations("faq");

  // *** สร้างรายการอัตโนมัติจากไฟล์ภาษา แทนการพิมพ์ q1..qN ตายตัว ***
  // เดิมเขียนตายตัวไว้แค่ q1-q6 ทำให้คำถามข้อ 7 ที่เพิ่มในไฟล์ภาษาไม่เคยแสดงบนหน้าเว็บเลย
  // ตอนนี้ถ้าเพิ่ม q8/a8 ในไฟล์ภาษา จะขึ้นเองทันทีโดยไม่ต้องกลับมาแก้ไฟล์นี้
  const items: { q: string; a: string }[] = [];
  // ใช้ t.has() เช็คก่อนว่ามีข้อความไหม — เดิมใช้ try/catch ซึ่ง next-intl จะพิมพ์ error
  // "MISSING_MESSAGE" ลง log ของเซิร์ฟเวอร์ทุกครั้งที่เปิดหน้านี้ (ตอนลองหาข้อถัดจากข้อสุดท้าย)
  for (let i = 1; i <= MAX_FAQ_ITEMS; i++) {
    if (!t.has(`q${i}`)) break; // ไม่มีคำถามข้อนี้แล้ว หยุดนับ
    const question = t(`q${i}`);
    const answer = t.has(`a${i}`) ? t(`a${i}`) : "";
    items.push({ q: question, a: answer });
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>{t("title")}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 13, margin: "0 0 24px" }}>{t("subtitle")}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: colors.primaryDark }}>
              {item.q}
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7 }}>
              {item.a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
