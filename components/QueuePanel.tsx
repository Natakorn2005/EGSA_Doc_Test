"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { colors, statusColors } from "@/lib/theme";

export type QueueDoc = {
  trackingId: string;
  docName: string;
  applicant: string;
  agencyType: string;
  agencyValue: string;
  submittedAt: string;
  reviewer: string;
  fileUrl: string;
};

type SignerOption = { name: string; roleLabel: string };
type ActionKind = "advance" | "reject" | "approve";

export default function QueuePanel({
  docs,
  mode,
  reviewerOptions,
  signerOptions,
}: {
  docs: QueueDoc[];
  mode: "secretary" | "president";
  reviewerOptions?: SignerOption[];
  signerOptions?: SignerOption[];
}) {
  const t = useTranslations("queue");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);
  const [flashWarning, setFlashWarning] = useState<string | null>(null);
  const [modal, setModal] = useState<{ doc: QueueDoc; action: ActionKind } | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  function toggleFile(trackingId: string) {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(trackingId)) next.delete(trackingId);
      else next.add(trackingId);
      return next;
    });
  }

  const agencyTypes = useMemo(
    () => Array.from(new Set(docs.map((d) => d.agencyType).filter(Boolean))),
    [docs]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (agencyFilter && d.agencyType !== agencyFilter) return false;
      if (!q) return true;
      return (
        d.docName.toLowerCase().includes(q) ||
        d.applicant.toLowerCase().includes(q) ||
        d.trackingId.toLowerCase().includes(q)
      );
    });
  }, [docs, search, agencyFilter]);

  const nameOptions: SignerOption[] =
    mode === "secretary"
      ? reviewerOptions || []
      : signerOptions || [];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "9px 12px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "var(--font-body)",
          }}
        />
        {agencyTypes.length > 1 && (
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "var(--font-body)",
              background: "#fff",
            }}
          >
            <option value="">{t("allAgencies")}</option>
            {agencyTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: colors.textSecondary,
            background: "#fff",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12,
          }}
        >
          <i className="ti ti-inbox-off" style={{ fontSize: 32, color: colors.textMuted }} aria-hidden="true" />
          <p style={{ margin: "10px 0 0", fontSize: 14 }}>
            {docs.length === 0
              ? mode === "secretary"
                ? t("emptySecretary")
                : t("emptyPresident")
              : t("emptySearch")}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {filtered.map((doc) => {
          const pendingKey = mode === "secretary" ? "รอตรวจสอบ" : "รอเซ็น";
          const pending = statusColors[pendingKey];
          const flashing = flashId === doc.trackingId;
          return (
            <div
              key={doc.trackingId}
              style={{
                background: flashing ? (flashWarning ? "#fff8e1" : "#f1f8f1") : "#fff",
                border: `1px solid ${flashing ? (flashWarning ? "#ffe082" : "#cde5cf") : colors.cardBorder}`,
                borderLeft: `4px solid ${colors.primary}`,
                borderRadius: "0 12px 12px 0",
                padding: 16,
                transition: "background 0.3s",
              }}
            >
              {flashing ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0" }}>
                  <i
                    className={`ti ${flashWarning ? "ti-alert-triangle" : "ti-circle-check"}`}
                    style={{ fontSize: 20, color: flashWarning ? "#8a4b00" : "#1b5e20", flexShrink: 0, marginTop: 1 }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: 14, color: flashWarning ? "#8a4b00" : "#1b5e20" }}>
                    {flashWarning || t("actionSuccess")}
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <strong style={{ fontSize: 15 }}>{doc.docName || doc.trackingId}</strong>
                    <span
                      style={{
                        background: pending.bg,
                        color: pending.color,
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pending.label}
                    </span>
                  </div>
                  <p style={{ color: colors.textSecondary, fontSize: 13, margin: "6px 0 2px" }}>
                    {t("applicant")}: {doc.applicant || "-"}
                    {mode === "president" && doc.reviewer ? ` · ${t("reviewedBy")}: ${doc.reviewer}` : ""}
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 10px" }}>
                    {doc.agencyValue || doc.agencyType} · {doc.trackingId}
                  </p>

                  {doc.fileUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={() => toggleFile(doc.trackingId)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: colors.textSecondary,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <i
                          className={`ti ${expandedFiles.has(doc.trackingId) ? "ti-chevron-down" : "ti-chevron-right"}`}
                          style={{ fontSize: 14 }}
                          aria-hidden="true"
                        />
                        {t("attachedFile")}
                      </button>
                      {expandedFiles.has(doc.trackingId) && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="egsa-link-btn"
                        >
                          <i className="ti ti-file-text" style={{ fontSize: 16 }} aria-hidden="true" />
                          {t("openDocument")}
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {mode === "secretary" ? (
                      <>
                        <button onClick={() => setModal({ doc, action: "advance" })} style={btnPrimary}>
                          {t("advanceButton")}
                        </button>
                        <button onClick={() => setModal({ doc, action: "reject" })} style={btnOutline}>
                          {t("rejectButton")}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setModal({ doc, action: "approve" })} style={btnPrimary}>
                        {t("approveButton")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <ActionModal
          doc={modal.doc}
          action={modal.action}
          nameOptions={nameOptions}
          onClose={() => setModal(null)}
          onSuccess={(warning) => {
            const id = modal.doc.trackingId;
            setModal(null);
            setFlashId(id);
            setFlashWarning(warning || null);
            setTimeout(() => router.refresh(), warning ? 2200 : 700);
          }}
        />
      )}
    </div>
  );
}

function ActionModal({
  doc,
  action,
  nameOptions,
  onClose,
  onSuccess,
}: {
  doc: QueueDoc;
  action: ActionKind;
  nameOptions: SignerOption[];
  onClose: () => void;
  onSuccess: (warning?: string) => void;
}) {
  const t = useTranslations("queue");
  const tc = useTranslations("common");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const showFilePicker = action === "reject" || action === "approve";
  const requiresFile = action === "approve"; // ตีกลับ = ไฟล์ไม่บังคับ, อนุมัติ = ไฟล์บังคับ
  const needsReason = action === "reject";

  const title =
    action === "advance" ? t("modalAdvanceTitle") : action === "reject" ? t("modalRejectTitle") : t("modalApproveTitle");
  const nameLabel = action === "approve" ? t("approverLabel") : t("reviewerLabel");
  const confirmText =
    action === "advance" ? t("confirmAdvance") : action === "reject" ? t("confirmReject") : t("confirmApprove");
  const noteText = action === "advance" ? t("noteAdvance") : action === "reject" ? t("noteReject") : t("noteApprove");

  function fail(msg: string) {
    setErrorMsg(msg);
    setStatus("error");
  }

  async function handleConfirm() {
    if (!name.trim()) return fail(action === "approve" ? t("pleaseSelectApprover") : t("pleaseSelectReviewer"));
    if (needsReason && !reason.trim()) return fail(t("pleaseEnterReason"));
    if (requiresFile && !file) return fail(t("pleaseAttachFile"));

    setStatus("loading");
    setErrorMsg("");

    try {
      let res: Response;
      if (action === "advance") {
        res = await fetch("/api/advance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingId: doc.trackingId, reviewerName: name.trim() }),
        });
      } else if (action === "reject") {
        const fd = new FormData();
        fd.append("trackingId", doc.trackingId);
        fd.append("reason", reason.trim());
        fd.append("reviewerName", name.trim());
        if (file) fd.append("file", file);
        res = await fetch("/api/reject", { method: "POST", body: fd });
      } else {
        const fd = new FormData();
        fd.append("trackingId", doc.trackingId);
        fd.append("approverName", name.trim());
        fd.append("file", file!);
        res = await fetch("/api/approve", { method: "POST", body: fd });
      }
      const data = await res.json();
      if (!data.success) return fail(data.error || t("genericError"));

      // *** ตรวจเฉพาะ action "advance" ว่าอีเมลแจ้งนายกฯ ส่งจริงหรือไม่ ***
      // ถ้าไม่พบอีเมลนายกฯ ในชีต "เจ้าหน้าที่" การส่งเรื่องยังสำเร็จ (เปลี่ยนสถานะแล้ว)
      // แต่ต้องแจ้งเตือนเลขาฯ ว่าไม่มีใครได้รับอีเมล ไม่ใช่แค่ขึ้น "สำเร็จ" เฉย ๆ
      if (action === "advance" && data.data?.emailSent === false) {
        onSuccess(t("advanceEmailWarning"));
        return;
      }

      onSuccess();
    } catch (e) {
      fail(e instanceof Error ? e.message : t("genericError"));
    }
  }

  return (
    <div
      onClick={status === "loading" ? undefined : onClose}
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
          maxWidth: 420,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ background: colors.primary, padding: "16px 20px" }}>
          <h2 style={{ color: "#fff", fontSize: 17, margin: 0 }}>{title}</h2>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ background: colors.tint, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.primaryDark }}>
              {doc.docName || doc.trackingId}
            </div>
            <div style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
              {t("applicant")}: {doc.applicant || "-"} · {doc.trackingId}
            </div>
          </div>

          <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
            {nameLabel} *
          </label>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "9px 10px",
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "var(--font-body)",
              marginBottom: 14,
              background: "#fff",
            }}
          >
            <option value="">{action === "approve" ? t("selectApprover") : t("selectReviewer")}</option>
            {nameOptions.map((o) => (
              <option key={o.name} value={o.name}>
                {o.name}
                {o.roleLabel ? ` (${o.roleLabel})` : ""}
              </option>
            ))}
          </select>

          {needsReason && (
            <>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
                {t("reasonLabel")} *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  minHeight: 64,
                  padding: 10,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  marginBottom: 14,
                  boxSizing: "border-box",
                }}
              />
            </>
          )}

          {showFilePicker && (
            <>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>
                {action === "approve" ? t("fileLabelApprove") : t("fileLabelReject")}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <div
                onClick={() => status !== "loading" && fileRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: `1px dashed ${colors.tintBorder}`,
                  borderRadius: 8,
                  cursor: status === "loading" ? "default" : "pointer",
                  marginBottom: 14,
                  background: colors.tint,
                }}
              >
                <i className="ti ti-upload" style={{ fontSize: 18, color: colors.primary }} aria-hidden="true" />
                <span
                  style={{
                    fontSize: 13,
                    color: file ? colors.primaryDark : colors.primary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file ? file.name : t("chooseFile")}
                </span>
              </div>
            </>
          )}

          <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 16px" }}>{noteText}</p>

          {status === "error" && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleConfirm}
              disabled={status === "loading"}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: status === "loading" ? "#999" : colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: status === "loading" ? "default" : "pointer",
                fontSize: 14,
                fontFamily: "var(--font-body)",
              }}
            >
              {status === "loading" ? tc("loading") : confirmText}
            </button>
            <button
              onClick={onClose}
              disabled={status === "loading"}
              style={{
                padding: "10px 16px",
                background: "#f0f0f0",
                color: colors.textSecondary,
                border: "none",
                borderRadius: 8,
                cursor: status === "loading" ? "default" : "pointer",
                fontSize: 14,
                fontFamily: "var(--font-body)",
              }}
            >
              {tc("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "7px 14px",
  background: colors.primary,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "var(--font-body)",
};

const btnOutline: React.CSSProperties = {
  padding: "7px 14px",
  background: "#fff",
  color: "#a32d2d",
  border: "1px solid #E8A9AE",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "var(--font-body)",
};