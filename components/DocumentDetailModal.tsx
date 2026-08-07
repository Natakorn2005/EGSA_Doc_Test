"use client";

import { useTranslations } from "next-intl";
import { colors } from "@/lib/theme";

export type DetailDoc = {
  trackingId: string;
  docName: string;
  status: string;
  submittedAt: string;
  reviewedAt: string;
  approvedAt: string;
  reviewer: string;
  approver: string;
  docNumber: string;
  rejectReason: string;
  fileUrl: string;
  finalFileUrl: string;
  resubmitLink: string;
};

export const STATUS_META: Record<string, { key: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { key: "statusPending", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { key: "statusWaitingSign", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { key: "statusApproved", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { key: "statusRejected", color: colors.primaryDark, bg: colors.tint },
};

export default function DocumentDetailModal({ doc, onClose }: { doc: DetailDoc; onClose: () => void }) {
  const t = useTranslations("my");
  const ts = useTranslations("status");
  const meta = STATUS_META[doc.status] || { key: "", color: "#444", bg: "#f5f5f5" };
  const isRejected = doc.status === "ตีกลับ";
  const isApproved = doc.status === "อนุมัติ";

  const steps = [
    { label: t("timelineSubmitted"), time: doc.submittedAt, done: true },
    {
      label: isRejected ? t("timelineRejected") : t("timelineReviewed"),
      time: doc.reviewedAt,
      done: !!doc.reviewedAt || isRejected,
    },
    {
      label: t("timelineApproved"),
      time: doc.approvedAt,
      done: isApproved,
      skip: isRejected,
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ background: colors.primary, padding: "16px 20px" }}>
          <h2 style={{ color: "#fff", fontSize: 16, margin: 0 }}>{doc.docName || doc.trackingId}</h2>
          <p style={{ color: "#F3D0D4", fontSize: 12, margin: "4px 0 0" }}>{doc.trackingId}</p>
        </div>

        <div style={{ padding: 20 }}>
          <span
            style={{
              display: "inline-block",
              background: meta.bg,
              color: meta.color,
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 20,
              marginBottom: 18,
            }}
          >
            {meta.key ? ts(meta.key) : doc.status}
          </span>

          <div style={{ marginBottom: 18 }}>
            {steps.map((step, i) => {
              if (step.skip) return null;
              return (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < steps.length - 1 ? 4 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: step.done ? colors.primary : "#ddd",
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                    {i < steps.length - (isRejected ? 2 : 1) && (
                      <div style={{ width: 2, flex: 1, background: "#eee", minHeight: 20 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: step.done ? colors.text : colors.textMuted }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{step.time || t("notYet")}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {doc.reviewer && (
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>
              {t("reviewedBy")}: <strong>{doc.reviewer}</strong>
            </p>
          )}
          {doc.approver && (
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>
              {t("approvedBy")}: <strong>{doc.approver}</strong>
            </p>
          )}
          {doc.docNumber && (
            <p style={{ fontSize: 13, margin: "0 0 6px" }}>
              {t("docNumber")}: <strong>{doc.docNumber}</strong>
            </p>
          )}

          {isRejected && doc.rejectReason && (
            <div style={{ background: colors.tint, borderRadius: 8, padding: "10px 12px", margin: "10px 0" }}>
              <div style={{ fontSize: 12, color: colors.primaryDark, fontWeight: 500, marginBottom: 4 }}>
                {t("rejectReason")}
              </div>
              <div style={{ fontSize: 13, color: colors.primaryDark }}>{doc.rejectReason}</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {doc.fileUrl && (
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                <i className="ti ti-file-text" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("viewFile")}
              </a>
            )}
            {isApproved && doc.finalFileUrl && (
              <a href={doc.finalFileUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                <i className="ti ti-file-check" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("viewFinalFile")}
              </a>
            )}
            {isRejected && doc.resubmitLink && (
              <a href={doc.resubmitLink} className="egsa-link-btn">
                <i className="ti ti-edit" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("resubmit")}
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "9px 16px",
              background: "#f0f0f0",
              color: colors.textSecondary,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
