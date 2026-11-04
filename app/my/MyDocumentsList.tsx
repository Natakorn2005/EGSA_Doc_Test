"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { colors } from "@/lib/theme";
import DocumentDetailModal, { STATUS_META, DetailDoc } from "@/components/DocumentDetailModal";
import AutoRefresh from "@/components/AutoRefresh";

export type MyDoc = DetailDoc & {
  /** รหัสรอบใหม่ที่ยื่นแก้จากรอบนี้แล้ว (ว่าง = ยังไม่ได้ยื่นแก้) */
  resubmittedAs?: string;
  /** แบบการตีกลับ: การศึกษา / เล็ก / ใหญ่ */
  rejectType?: string;
};

type Group = "todo" | "waiting" | "done";

// สถานะที่รอคนอื่นทำ → อยู่ที่ใคร
const WAITING_ON: Record<string, string> = {
  "รอการศึกษาตรวจ": "whoEducation",
  "รอตรวจสอบ": "whoSecretary",
  "รอเซ็น": "whoPresident",
  "รอรองคณบดีเซ็น": "whoDean",
};

function groupOf(doc: MyDoc): Group {
  if (doc.status === "รอเซ็นประธาน/อาจารย์") return "todo";
  if (doc.status === "ตีกลับ") return doc.resubmittedAs ? "done" : "todo";
  if (doc.status === "อนุมัติ") return "done";
  return "waiting";
}

/** ลิงก์ยื่นแก้ในชีตเป็น URL เต็มของเว็บนี้ — ตัดเหลือ path เพื่อใช้ <Link> (ไม่โหลดหน้าใหม่ทั้งหน้า) */
function toInternalPath(url: string): string | null {
  for (const p of ["/submit?", "/upload-signed?"]) {
    const i = url.indexOf(p);
    if (i !== -1) return url.slice(i);
  }
  return null;
}

export default function MyDocumentsList({ docs }: { docs: MyDoc[] }) {
  const t = useTranslations("my");
  const [selected, setSelected] = useState<MyDoc | null>(null);
  const [showDone, setShowDone] = useState(false);
  // ใช้ข้อมูลล่าสุดหลังรีเฟรชเสมอ (เช่น ไฟล์เพิ่งแชร์เสร็จ ลิงก์ในหน้าต่างรายละเอียดจะโผล่ขึ้นเอง)
  const selectedDoc = selected ? docs.find((d) => d.trackingId === selected.trackingId) || selected : null;

  const todo = docs.filter((d) => groupOf(d) === "todo");
  const waiting = docs.filter((d) => groupOf(d) === "waiting");
  const done = docs.filter((d) => groupOf(d) === "done");

  return (
    <>
      {docs.some((d) => d.sharePending) && <AutoRefresh />}

      <Section
        icon="ti-alert-circle"
        title={t("sectionTodo")}
        count={todo.length}
        accent={colors.primary}
        empty={t("todoEmpty")}
      >
        {todo.map((doc) => (
          <DocCard key={doc.trackingId} doc={doc} group="todo" onOpen={() => setSelected(doc)} />
        ))}
      </Section>

      <Section icon="ti-hourglass" title={t("sectionWaiting")} count={waiting.length} accent="#8a6d00" empty={t("waitingEmpty")}>
        {waiting.map((doc) => (
          <DocCard key={doc.trackingId} doc={doc} group="waiting" onOpen={() => setSelected(doc)} />
        ))}
      </Section>

      {done.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              background: "none",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              color: colors.textSecondary,
            }}
          >
            <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#1b5e20" }} aria-hidden="true" />
            {t("sectionDone")}
            <CountPill n={done.length} color={colors.textSecondary} />
            <i className={`ti ${showDone ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ marginLeft: "auto", fontSize: 18 }} aria-hidden="true" />
          </button>
          {showDone && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {done.map((doc) => (
                <DocCard key={doc.trackingId} doc={doc} group="done" onOpen={() => setSelected(doc)} />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelected(null)} finalFileIsSigned />}
    </>
  );
}

function Section({
  icon,
  title,
  count,
  accent,
  empty,
  children,
}: {
  icon: string;
  title: string;
  count: number;
  accent: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: colors.text }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18, color: accent }} aria-hidden="true" />
        {title}
        <CountPill n={count} color={accent} />
      </h2>
      {count === 0 ? (
        <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, padding: "4px 0 0 26px" }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
      )}
    </section>
  );
}

function CountPill({ n, color }: { n: number; color: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color, background: "#f3f3f3", borderRadius: 20, padding: "1px 9px" }}>{n}</span>
  );
}

function DocCard({ doc, group, onOpen }: { doc: MyDoc; group: Group; onOpen: () => void }) {
  const t = useTranslations("my");
  const ts = useTranslations("status");
  const meta = STATUS_META[doc.status] || { key: "", color: "#444", bg: "#f5f5f5" };
  const isTodo = group === "todo";
  const needsUpload = doc.status === "รอเซ็นประธาน/อาจารย์";
  const resubmitPath = doc.status === "ตีกลับ" && doc.resubmitLink ? toInternalPath(doc.resubmitLink) : null;

  // บรรทัดบอกว่าต้องทำอะไร / อยู่ที่ใคร
  let note: string | null = null;
  if (needsUpload) note = t("todoUploadHint");
  else if (isTodo && doc.status === "ตีกลับ") note = doc.rejectReason ? t("todoRejectedHint", { reason: doc.rejectReason }) : t("todoRejectedHintNoReason");
  else if (group === "waiting" && WAITING_ON[doc.status]) note = t(WAITING_ON[doc.status]);
  else if (doc.status === "ตีกลับ" && doc.resubmittedAs) note = t("resubmittedAs", { id: doc.resubmittedAs });

  return (
    <div
      style={{
        border: `1px solid ${isTodo ? colors.tintBorder : colors.cardBorder}`,
        borderLeft: isTodo ? `4px solid ${colors.primary}` : `1px solid ${colors.cardBorder}`,
        borderRadius: 10,
        background: "#fff",
        opacity: group === "done" ? 0.85 : 1,
      }}
    >
      <button
        onClick={onOpen}
        style={{
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          color: "inherit",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.docName || doc.trackingId}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {doc.trackingId}
            {doc.eduNumber ? ` · ${doc.eduNumber}` : ""} · {t("submittedAt")}: {doc.submittedAt || "-"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ background: meta.bg, color: meta.color, fontSize: 12, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {meta.key ? ts(meta.key) : doc.status}
          </span>
          <i className="ti ti-chevron-right" style={{ fontSize: 18, color: colors.textMuted }} aria-hidden="true" />
        </div>
      </button>

      {(note || needsUpload || resubmitPath) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            padding: "0 16px 14px",
          }}
        >
          {note && (
            <span style={{ fontSize: 13, color: isTodo ? colors.primaryDark : colors.textSecondary, flex: "1 1 220px", lineHeight: 1.5 }}>
              {note}
            </span>
          )}
          {needsUpload && (
            <Link href={`/upload-signed?id=${encodeURIComponent(doc.trackingId)}`} style={actionBtn}>
              <i className="ti ti-upload" style={{ fontSize: 15 }} aria-hidden="true" />
              {t("uploadSigned")}
            </Link>
          )}
          {isTodo && resubmitPath && (
            <Link href={resubmitPath} style={actionBtn}>
              <i className="ti ti-edit" style={{ fontSize: 15 }} aria-hidden="true" />
              {doc.rejectType === "เล็ก" ? t("resubmitSmall") : doc.rejectType === "ใหญ่" ? t("resubmitBig") : t("resubmit")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  background: colors.primary,
  color: "#fff",
  borderRadius: 7,
  textDecoration: "none",
  fontSize: 13,
  whiteSpace: "nowrap",
};
