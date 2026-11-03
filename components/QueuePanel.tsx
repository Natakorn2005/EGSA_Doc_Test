"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { colors, statusColors } from "@/lib/theme";
import AutoRefresh from "@/components/AutoRefresh";
import { fallbackFormUrl } from "@/lib/formLinks";
import { useSendQueue, type SendRequest } from "@/components/SendQueue";

export type QueueDoc = {
  trackingId: string;
  docName: string;
  applicant: string;
  agencyType: string;
  agencyValue: string;
  submittedAt: string;
  reviewer: string;
  fileUrl: string;
  approveFormUrl?: string;
  /** คิวเบื้องหลังยังแชร์ไฟล์ไม่เสร็จ — ซ่อนลิงก์เปิดไฟล์ไว้ก่อน */
  sharePending?: boolean;
  rejectFormUrl?: string;
};

type ActionKind = "advance" | "reject" | "approve";
export type ActingAs = { name: string; roleLabel: string } | null;

export default function QueuePanel({
  docs,
  mode,
  actingAs,
}: {
  docs: QueueDoc[];
  mode: "secretary" | "president";
  actingAs: ActingAs;
}) {
  const t = useTranslations("queue");
  const tsq = useTranslations("sendQueue");
  const tcommon = useTranslations("common");
  const { jobs, enqueue } = useSendQueue();
  // เอกสารที่กำลังส่งคำสั่งอยู่เบื้องหลัง — ซ่อนปุ่มไว้กันกดซ้ำ
  const busyIds = useMemo(
    () => new Set(jobs.filter((j) => j.status === "sending" && j.trackingId).map((j) => j.trackingId as string)),
    [jobs]
  );
  // คำสั่งที่ส่งสำเร็จแล้ว แต่หน้ายังโหลดรายการใหม่ไม่เสร็จ — แสดงว่าสำเร็จแทนปุ่ม
  // (ถ้าไม่ทำ ปุ่มเดิมจะเด้งกลับมาให้เห็นแวบหนึ่งก่อนเอกสารหายจากคิว)
  const doneKinds = useMemo(() => {
    const m = new Map<string, ActionKind>();
    for (const j of jobs) {
      if (j.status === "done" && j.trackingId && j.kind !== "submit") m.set(j.trackingId, j.kind as ActionKind);
    }
    return m;
  }, [jobs]);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
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

  return (
    <div>
      {docs.some((d) => d.sharePending) && <AutoRefresh />}

      {actingAs && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: colors.tint,
            border: `1px solid ${colors.tintBorder}`,
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: colors.primaryDark,
          }}
        >
          <i className="ti ti-user-check" style={{ fontSize: 16 }} aria-hidden="true" />
          {t("actingAs")}: <strong>{actingAs.name}</strong> ({actingAs.roleLabel})
        </div>
      )}

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
          const busy = busyIds.has(doc.trackingId);
          const doneKind = doneKinds.get(doc.trackingId);
          return (
            <div
              key={doc.trackingId}
              style={{
                background: "#fff",
                border: `1px solid ${colors.cardBorder}`,
                borderLeft: `4px solid ${colors.primary}`,
                borderRadius: "0 12px 12px 0",
                padding: 16,
                transition: "background 0.3s",
              }}
            >
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
                      {expandedFiles.has(doc.trackingId) && doc.sharePending && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textSecondary }}>
                          <i className="ti ti-hourglass" style={{ fontSize: 15 }} aria-hidden="true" />
                          {tcommon("filePreparing")}
                        </span>
                      )}
                      {expandedFiles.has(doc.trackingId) && !doc.sharePending && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                          <i className="ti ti-file-text" style={{ fontSize: 16 }} aria-hidden="true" />
                          {t("openDocument")}
                        </a>
                      )}
                    </div>
                  )}

                  {doneKind ? (
                    <div
                      role="status"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 12,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#f1f8f1",
                        color: "#1b5e20",
                        fontSize: 13,
                      }}
                    >
                      <i className="ti ti-circle-check" style={{ fontSize: 17 }} aria-hidden="true" />
                      {tsq(`done.${doneKind}`)}
                    </div>
                  ) : busy ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 12,
                        fontSize: 13,
                        color: colors.textSecondary,
                      }}
                    >
                      <span className="egsa-spinner egsa-spinner-dark" aria-hidden="true" />
                      {tsq("inProgress")}
                    </div>
                  ) : (
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
                  )}
                </>
            </div>
          );
        })}
      </div>

      {modal && (
        <ActionModal
          doc={modal.doc}
          action={modal.action}
          actingAs={actingAs}
          onClose={() => setModal(null)}
          onSubmit={(request) => {
            enqueue({
              kind: modal.action,
              label: modal.doc.docName || modal.doc.trackingId,
              trackingId: modal.doc.trackingId,
              request,
            });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ActionModal({
  doc,
  action,
  actingAs,
  onClose,
  onSubmit,
}: {
  doc: QueueDoc;
  action: ActionKind;
  actingAs: ActingAs;
  onClose: () => void;
  /** ส่งคำสั่งเข้าคิวเบื้องหลัง (components/SendQueue.tsx) แล้วปิดหน้าต่างทันที ไม่ต้องรอผล */
  onSubmit: (request: SendRequest) => void;
}) {
  const t = useTranslations("queue");
  const tc = useTranslations("common");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tooLarge, setTooLarge] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showFilePicker = action === "reject" || action === "approve";
  const requiresFile = action === "approve";
  const needsReason = action === "reject";

  const title =
    action === "advance" ? t("modalAdvanceTitle") : action === "reject" ? t("modalRejectTitle") : t("modalApproveTitle");
  const confirmText =
    action === "advance" ? t("confirmAdvance") : action === "reject" ? t("confirmReject") : t("confirmApprove");
  const noteText = action === "advance" ? t("noteAdvance") : action === "reject" ? t("noteReject") : t("noteApprove");

  function fail(msg: string) {
    setErrorMsg(msg);
    setStatus("error");
  }

  function handleConfirm() {
    if (needsReason && !reason.trim()) return fail(t("pleaseEnterReason"));
    if (requiresFile && !file) return fail(t("pleaseAttachFile"));

    if (action === "advance") {
      onSubmit({ endpoint: "/api/advance", body: { trackingId: doc.trackingId } });
    } else if (action === "reject") {
      const fd = new FormData();
      fd.append("trackingId", doc.trackingId);
      fd.append("reason", reason.trim());
      if (file) fd.append("file", file);
      onSubmit({ endpoint: "/api/reject", body: fd });
    } else {
      const fd = new FormData();
      fd.append("trackingId", doc.trackingId);
      fd.append("file", file!);
      onSubmit({ endpoint: "/api/approve", body: fd });
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
          <div style={{ background: colors.tint, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.primaryDark }}>
              {doc.docName || doc.trackingId}
            </div>
            <div style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
              {t("applicant")}: {doc.applicant || "-"} · {doc.trackingId}
            </div>
          </div>

          {actingAs && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: colors.textSecondary,
                marginBottom: 16,
              }}
            >
              <i className="ti ti-user-check" style={{ fontSize: 15 }} aria-hidden="true" />
              {t("actingAs")}: <strong>{actingAs.name}</strong> ({actingAs.roleLabel})
            </div>
          )}

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
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setTooLarge(false);
                  if (picked) {
                    const MAX_SIZE = 3 * 1024 * 1024;
                    if (picked.size > MAX_SIZE) {
                      setFile(null);
                      setTooLarge(true);
                      setStatus("idle");
                      setErrorMsg("");
                      if (fileRef.current) fileRef.current.value = "";
                      return;
                    }
                    if (picked.type !== "application/pdf") {
                      setFile(null);
                      fail(t("fileMustBePdf"));
                      if (fileRef.current) fileRef.current.value = "";
                      return;
                    }
                  }
                  setFile(picked);
                }}
                style={{ display: "none" }}
              />
              <p style={{ fontSize: 11, color: colors.textMuted, margin: "0 0 8px" }}>{t("fileHint")}</p>
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


          {tooLarge && (action === "approve" || action === "reject") && (() => {
            const formUrl = fallbackFormUrl(
              action,
              {
                trackingId: doc.trackingId,
                reason: action === "reject" ? reason : undefined,
                person: actingAs?.roleLabel,
              },
              action === "approve" ? doc.approveFormUrl : doc.rejectFormUrl
            );
            return (
              <div
                style={{
                  background: "#fff8e1",
                  border: "1px solid #f0d58c",
                  borderRadius: 8,
                  padding: "10px 12px",
                  margin: "0 0 14px",
                  fontSize: 13,
                  color: "#6b5200",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 16, marginTop: 1 }} aria-hidden="true" />
                  <span>{formUrl ? t("tooLargeUseForm") : t("tooLargeNoForm")}</span>
                </div>
                {formUrl && (
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 10,
                      padding: "8px 14px",
                      background: colors.primary,
                      color: "#fff",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    <i className="ti ti-external-link" aria-hidden="true" />
                    {action === "approve" ? t("tooLargeApproveButton") : t("tooLargeRejectButton")}
                  </a>
                )}
              </div>
            );
          })()}

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