// ธีมสีแดงเลือดหมู EGSA — ใช้ร่วมกันทุกหน้า ปรับสีที่นี่ที่เดียวมีผลทั้งเว็บ

export const colors = {
  primary: "#6E1423",
  primaryDark: "#4A0D18",
  primaryMid: "#8B1A2E",
  primaryLight: "#A83248",
  tint: "#FBEAEC",
  tintBorder: "#E8A9AE",
  text: "#1a1a1a",
  textSecondary: "#666",
  textMuted: "#999",
  pageBg: "#faf7f7",
  cardBorder: "#eee",
};

export const layout = {
  sidebarWidth: 240,
  contentMaxWidth: 900,
};

// ป้ายสถานะ — ตั้งใจไม่ใช้สีธีมหลัก เพราะสีสถานะสื่อความหมายของตัวเอง
export const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { label: "รอตรวจสอบ", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { label: "รอเซ็นอนุมัติ", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { label: "อนุมัติแล้ว", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { label: "ถูกตีกลับ", color: colors.primaryDark, bg: colors.tint },
};

export const heroStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryMid} 55%, ${colors.primaryLight} 100%)`,
  borderRadius: 16,
  padding: "24px 26px",
};

export const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: 12,
  padding: 16,
};

export const tileStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  color: "inherit",
};

export const iconBoxStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: colors.tint,
  color: colors.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

export const buttonPrimaryStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: colors.primary,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: "var(--font-body)",
};

export const buttonSecondaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: colors.primary,
  border: `1px solid ${colors.tintBorder}`,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "var(--font-body)",
};

export const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "var(--font-body)",
};