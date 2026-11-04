"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { colors, statusColors } from "@/lib/theme";
import AutoRefresh from "@/components/AutoRefresh";
import { useSendQueue } from "@/components/SendQueue";
import {
  checkEduNumber,
  eduNumberSuffix,
  latestEduNumbers,
  EDU_PREFIX,
  type EduNumberUse,
} from "@/lib/eduNumber";

export type EduDoc = {
  trackingId: string;
  docName: string;
  applicant: string;
  phone: string;
  agency: string;
  submittedAt: string;
  wordUrl: string;
  sharePending: boolean;
  /** รหัสรอบก่อนของเรื่องเดียวกัน (ใหม่ → เก่า) */
  chainIds: string[];
  /** เลข สวศ. ของรอบก่อน — มีค่าแปลว่ากลับมาจากการตีกลับแบบใหญ่ */
  prevNumber: string;
  prevReason: string;
  prevRejectBy: string;
};

type ActingAs = { name: string; roleLabel: string } | null;

const MAX_SIZE = 3 * 1024 * 1024;
const isWordName = (n: string) => /\.docx?$/i.test(n);
const isPdfName = (n: string) => /\.pdf$/i.test(n);

export default function EducationQueue({
  docs,
  numberIndex,
  actingAs,
  openId,
}: {
  docs: EduDoc[];
  numberIndex: EduNumberUse[];
  actingAs: ActingAs;
  openId: string | null;
}) {
  const t = useTranslations("education");
  const tsq = useTranslations("sendQueue");
  const tcommon = useTranslations("common");
  const { jobs, enqueue } = useSendQueue();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ doc: EduDoc; action: "approve" | "reject" } | null>(null);

  const busyIds = useMemo(
    () => new Set(jobs.filter((j) => j.status === "sending" && j.trackingId).map((j) => j.trackingId as string)),
    [jobs]
  );
  const doneKinds = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of jobs) if (j.status === "done" && j.trackingId) m.set(j.trackingId, j.kind);
    return m;
  }, [jobs]);

  const latest = useMemo(() => latestEduNumbers(numberIndex), [numberIndex]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.docName.toLowerCase().includes(q) ||
        d.applicant.toLowerCase().includes(q) ||
        d.trackingId.toLowerCase().includes(q) ||
        d.agency.toLowerCase().includes(q)
    );
  }, [docs, search]);

  // มาจากปุ่ม "เปิดเอกสารนี้" ในอีเมล — เลื่อนไปที่การ์ดนั้น
  useEffect(() => {
    if (!openId) return;
    document.getElementById(`edu-${openId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [openId]);

  const pending = statusColors["รอการศึกษาตรวจ"];

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

      <input
        type="text"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "9px 12px",
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "var(--font-body)",
          marginBottom: 20,
        }}
      />

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
          <p style={{ margin: "10px 0 0", fontSize: 14 }}>{docs.length === 0 ? t("empty") : t("emptySearch")}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map((doc) => {
          const busy = busyIds.has(doc.trackingId);
          const doneKind = doneKinds.get(doc.trackingId);
          const highlighted = openId === doc.trackingId;
          return (
            <div
              key={doc.trackingId}
              id={`edu-${doc.trackingId}`}
              style={{
                background: "#fff",
                border: `1px solid ${highlighted ? colors.primary : colors.cardBorder}`,
                borderLeft: `4px solid ${colors.primary}`,
                borderRadius: "0 12px 12px 0",
                padding: 16,
                boxShadow: highlighted ? "0 0 0 3px rgba(110,20,35,0.12)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <strong style={{ fontSize: 15, overflowWrap: "anywhere" }}>{doc.docName || doc.trackingId}</strong>
                <span
                  style={{
                    background: doc.prevNumber ? "#fff3e0" : pending.bg,
                    color: doc.prevNumber ? "#8a4b00" : pending.color,
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.prevNumber ? t("recheckBadge") : pending.label}
                </span>
              </div>
              <p style={{ color: colors.textSecondary, fontSize: 13, margin: "6px 0 2px" }}>
                {t("applicant")}: {doc.applicant || "-"}
                {doc.phone ? ` · ${doc.phone}` : ""}
              </p>
              <p style={{ color: colors.textMuted, fontSize: 12, margin: "0 0 10px" }}>
                {doc.agency} · {doc.trackingId}
                {doc.submittedAt ? ` · ${doc.submittedAt}` : ""}
              </p>

              {doc.prevNumber && (
                <div
                  style={{
                    background: "#fff8e1",
                    border: "1px solid #ffe082",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#6b5200",
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    {t("recheckPrevNumber")}: <strong>{doc.prevNumber}</strong>
                    {doc.prevRejectBy ? ` · ${t("recheckRejectedBy")}: ${doc.prevRejectBy}` : ""}
                  </div>
                  {doc.prevReason && (
                    <div>
                      {t("recheckReason")}: {doc.prevReason}
                    </div>
                  )}
                </div>
              )}

              {doc.wordUrl &&
                (doc.sharePending ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textSecondary }}>
                    <i className="ti ti-hourglass" style={{ fontSize: 15 }} aria-hidden="true" />
                    {tcommon("filePreparing")}
                  </span>
                ) : (
                  <a href={doc.wordUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                    <i className="ti ti-file-word" style={{ fontSize: 16 }} aria-hidden="true" />
                    {t("openWord")}
                  </a>
                ))}

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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: colors.textSecondary }}>
                  <span className="egsa-spinner egsa-spinner-dark" aria-hidden="true" />
                  {tsq("inProgress")}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button onClick={() => setModal({ doc, action: "approve" })} style={btnPrimary}>
                    {t("approveButton")}
                  </button>
                  <button onClick={() => setModal({ doc, action: "reject" })} style={btnOutline}>
                    {t("rejectButton")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal?.action === "approve" && (
        <ApproveModal
          doc={modal.doc}
          numberIndex={numberIndex}
          latest={latest}
          actingAs={actingAs}
          onClose={() => setModal(null)}
          onSubmit={(word, pdf, eduNumber, confirmDuplicate) => {
            const attach = (kind: "word" | "pdf", file: File) => {
              const fd = new FormData();
              fd.append("trackingId", modal.doc.trackingId);
              fd.append("kind", kind);
              fd.append("file", file);
              return fd;
            };
            // ส่งทีละไฟล์ (ไฟล์ละไม่เกิน 3 MB) แล้วค่อยกดส่งคืน — ลองใหม่จะเริ่มจากขั้นที่ล้ม
            enqueue({
              kind: "eduReturn",
              label: modal.doc.docName || modal.doc.trackingId,
              trackingId: modal.doc.trackingId,
              request: {
                endpoint: "/api/education/attach",
                body: attach("word", word),
                next: [
                  { endpoint: "/api/education/attach", body: attach("pdf", pdf) },
                  {
                    endpoint: "/api/education/approve",
                    body: { trackingId: modal.doc.trackingId, eduNumber, confirmDuplicate },
                  },
                ],
              },
            });
            setModal(null);
          }}
        />
      )}

      {modal?.action === "reject" && (
        <RejectModal
          doc={modal.doc}
          actingAs={actingAs}
          onClose={() => setModal(null)}
          onSubmit={(reason, file) => {
            const fd = new FormData();
            fd.append("trackingId", modal.doc.trackingId);
            fd.append("reason", reason);
            if (file) fd.append("file", file);
            enqueue({
              kind: "eduReject",
              label: modal.doc.docName || modal.doc.trackingId,
              trackingId: modal.doc.trackingId,
              request: { endpoint: "/api/education/reject", body: fd },
            });
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// หน้าต่างส่งคืนผู้ยื่น — เลข สวศ. + Word + PDF (ช่องเดียว ลากมาพร้อมกันได้)
// ---------------------------------------------------------------------------

function ApproveModal({
  doc,
  numberIndex,
  latest,
  actingAs,
  onClose,
  onSubmit,
}: {
  doc: EduDoc;
  numberIndex: EduNumberUse[];
  latest: { plain: string | null; wor: string | null };
  actingAs: ActingAs;
  onClose: () => void;
  onSubmit: (word: File, pdf: File, eduNumber: string, confirmDuplicate: boolean) => void;
}) {
  const t = useTranslations("education");
  const tc = useTranslations("common");
  const isRecheck = !!doc.prevNumber;
  const [useOld, setUseOld] = useState(isRecheck);
  const [numberInput, setNumberInput] = useState("");
  const [word, setWord] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [fileMsg, setFileMsg] = useState("");
  const [confirmDup, setConfirmDup] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rawNumber = useOld ? eduNumberSuffix(doc.prevNumber) : numberInput;
  // เลือก "ใช้เลขเดิม" = เรื่องเดียวกันที่วนกลับมา ไม่ต้องเตือนซ้ำ
  const check = checkEduNumber(rawNumber, numberIndex, [doc.trackingId, ...doc.chainIds]);

  function takeFiles(list: FileList | File[]) {
    const msgs: string[] = [];
    let nextWord = word;
    let nextPdf = pdf;
    for (const f of Array.from(list)) {
      if (f.size > MAX_SIZE) {
        msgs.push(t("fileTooLarge", { name: f.name }));
      } else if (isWordName(f.name)) {
        nextWord = f;
      } else if (isPdfName(f.name)) {
        nextPdf = f;
      } else {
        msgs.push(t("fileWrongType", { name: f.name }));
      }
    }
    setWord(nextWord);
    setPdf(nextPdf);
    setFileMsg(msgs.join(" "));
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleConfirm() {
    if (check.state === "empty") return setError(t("errNumberRequired"));
    if (check.state === "invalid") return setError(t("numberFormatHint"));
    if (!word || !pdf) return setError(t("errBothFiles"));
    if (check.state === "inUse" && !confirmDup) return setError(t("errConfirmDuplicate"));
    onSubmit(word, pdf, check.normalized, check.state === "inUse");
  }

  return (
    <ModalFrame title={t("approveTitle")} doc={doc} actingAs={actingAs} onClose={onClose}>
      <label style={labelStyle}>{t("numberLabel")} *</label>

      {isRecheck && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="radio" checked={useOld} onChange={() => setUseOld(true)} />
            {t("useOldNumber")} <strong>{doc.prevNumber}</strong>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="radio" checked={!useOld} onChange={() => setUseOld(false)} />
            {t("useNewNumber")}
          </label>
        </div>
      )}

      {!useOld && (
        <div style={{ display: "flex", alignItems: "stretch", marginBottom: 6 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              background: "#f5f5f5",
              border: `1px solid ${colors.cardBorder}`,
              borderRight: "none",
              borderRadius: "8px 0 0 8px",
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {EDU_PREFIX.trim()}
          </span>
          <input
            value={numberInput}
            onChange={(e) => {
              setNumberInput(e.target.value);
              setConfirmDup(false);
              setError("");
            }}
            placeholder={t("numberPlaceholder")}
            inputMode="text"
            autoFocus
            style={{
              flex: 1,
              minWidth: 0,
              padding: "9px 10px",
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: "0 8px 8px 0",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
      )}

      {(latest.plain || latest.wor) && !useOld && (
        <p style={{ fontSize: 11, color: colors.textMuted, margin: "0 0 6px" }}>
          {t("latestNumbers")}: {[latest.plain, latest.wor].filter(Boolean).join(" · ")}
        </p>
      )}

      <NumberFeedback check={check} confirmDup={confirmDup} setConfirmDup={setConfirmDup} />

      <label style={{ ...labelStyle, marginTop: 14 }}>{t("filesLabel")} *</label>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => e.target.files && takeFiles(e.target.files)}
        style={{ display: "none" }}
      />
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          takeFiles(e.dataTransfer.files);
        }}
        style={{
          padding: "12px 12px",
          border: `1px dashed ${dragOver ? colors.primary : colors.tintBorder}`,
          borderRadius: 8,
          cursor: "pointer",
          background: colors.tint,
          fontSize: 13,
          color: colors.primary,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-upload" style={{ fontSize: 18 }} aria-hidden="true" />
          {t("dropHint")}
        </div>
        <FileLine ok={!!word} label="Word" name={word?.name} missing={t("fileMissing")} />
        <FileLine ok={!!pdf} label="PDF" name={pdf?.name} missing={t("fileMissing")} />
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, margin: "6px 0 0" }}>{t("filesHint")}</p>
      {fileMsg && <p style={{ fontSize: 12, color: "#8a4b00", margin: "6px 0 0" }}>{fileMsg}</p>}

      <p style={{ fontSize: 12, color: colors.textMuted, margin: "14px 0 12px" }}>{t("approveNote")}</p>
      {error && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

      <ModalButtons confirmText={t("confirmApprove")} cancelText={tc("cancel")} onConfirm={handleConfirm} onClose={onClose} />
    </ModalFrame>
  );
}

function NumberFeedback({
  check,
  confirmDup,
  setConfirmDup,
}: {
  check: ReturnType<typeof checkEduNumber>;
  confirmDup: boolean;
  setConfirmDup: (v: boolean) => void;
}) {
  const t = useTranslations("education");
  if (check.state === "empty") return null;
  if (check.state === "invalid") {
    return <p style={{ fontSize: 12, color: "#b00020", margin: 0 }}>{t("numberFormatHint")}</p>;
  }
  if (check.state === "ok") {
    return (
      <p style={{ fontSize: 12, color: "#1b5e20", margin: 0 }}>
        <i className="ti ti-check" aria-hidden="true" /> {check.normalized}
      </p>
    );
  }
  if (check.state === "usedBefore") {
    return (
      <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0 }}>
        {t("numberUsedBefore", { ids: check.uses.map((u) => u.trackingId).join(", ") })}
      </p>
    );
  }
  return (
    <div
      style={{
        background: "#fff8e1",
        border: "1px solid #f0d58c",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        color: "#6b5200",
      }}
    >
      <div style={{ marginBottom: 6 }}>{t("numberInUse", { number: check.normalized })}</div>
      {check.uses.map((u) => (
        <div key={u.trackingId}>
          · {u.trackingId} — {u.docName || "-"} ({u.status})
        </div>
      ))}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8 }}>
        <input type="checkbox" checked={confirmDup} onChange={(e) => setConfirmDup(e.target.checked)} style={{ marginTop: 2 }} />
        {t("confirmDuplicate")}
      </label>
    </div>
  );
}

function FileLine({ ok, label, name, missing }: { ok: boolean; label: string; name?: string; missing: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: ok ? colors.primaryDark : colors.textMuted }}>
      <i className={`ti ${ok ? "ti-circle-check" : "ti-circle-dashed"}`} style={{ fontSize: 15 }} aria-hidden="true" />
      <strong style={{ minWidth: 36 }}>{label}</strong>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || missing}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// หน้าต่างตีกลับของการศึกษา — เอกสารไม่ได้เลข สวศ.
// ---------------------------------------------------------------------------

function RejectModal({
  doc,
  actingAs,
  onClose,
  onSubmit,
}: {
  doc: EduDoc;
  actingAs: ActingAs;
  onClose: () => void;
  onSubmit: (reason: string, file: File | null) => void;
}) {
  const t = useTranslations("education");
  const tc = useTranslations("common");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <ModalFrame title={t("rejectTitle")} doc={doc} actingAs={actingAs} onClose={onClose}>
      <label style={labelStyle}>{t("reasonLabel")} *</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{
          width: "100%",
          minHeight: 72,
          padding: 10,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "var(--font-body)",
          marginBottom: 14,
          boxSizing: "border-box",
        }}
      />
      <label style={labelStyle}>{t("rejectFileLabel")}</label>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => {
          const picked = e.target.files?.[0] || null;
          if (picked && picked.size > MAX_SIZE) {
            setFile(null);
            setError(t("fileTooLarge", { name: picked.name }));
          } else if (picked && !isPdfName(picked.name)) {
            setFile(null);
            setError(t("rejectFileMustBePdf"));
          } else {
            setFile(picked);
            setError("");
          }
          if (fileRef.current) fileRef.current.value = "";
        }}
        style={{ display: "none" }}
      />
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: `1px dashed ${colors.tintBorder}`,
          borderRadius: 8,
          cursor: "pointer",
          background: colors.tint,
          fontSize: 13,
          color: file ? colors.primaryDark : colors.primary,
        }}
      >
        <i className="ti ti-upload" style={{ fontSize: 18, color: colors.primary }} aria-hidden="true" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file ? file.name : t("chooseFile")}</span>
      </div>

      <p style={{ fontSize: 12, color: colors.textMuted, margin: "14px 0 12px" }}>{t("rejectNote")}</p>
      {error && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

      <ModalButtons
        confirmText={t("confirmReject")}
        cancelText={tc("cancel")}
        onConfirm={() => {
          if (!reason.trim()) return setError(t("errReasonRequired"));
          onSubmit(reason.trim(), file);
        }}
        onClose={onClose}
      />
    </ModalFrame>
  );
}

// ---------------------------------------------------------------------------
// ส่วนประกอบหน้าต่างที่ใช้ร่วมกัน
// ---------------------------------------------------------------------------

function ModalFrame({
  title,
  doc,
  actingAs,
  onClose,
  children,
}: {
  title: string;
  doc: EduDoc;
  actingAs: ActingAs;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("education");
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
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ background: colors.primary, padding: "16px 20px" }}>
          <h2 style={{ color: "#fff", fontSize: 17, margin: 0 }}>{title}</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: colors.tint, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: colors.primaryDark, overflowWrap: "anywhere" }}>
              {doc.docName || doc.trackingId}
            </div>
            <div style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>
              {t("applicant")}: {doc.applicant || "-"} · {doc.trackingId}
            </div>
          </div>
          {actingAs && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
              <i className="ti ti-user-check" style={{ fontSize: 15 }} aria-hidden="true" />
              {t("actingAs")}: <strong>{actingAs.name}</strong> ({actingAs.roleLabel})
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalButtons({
  confirmText,
  cancelText,
  onConfirm,
  onClose,
}: {
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={onConfirm}
        style={{
          flex: 1,
          padding: "10px 16px",
          background: colors.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          fontFamily: "var(--font-body)",
        }}
      >
        {confirmText}
      </button>
      <button
        onClick={onClose}
        style={{
          padding: "10px 16px",
          background: "#f0f0f0",
          color: colors.textSecondary,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          fontFamily: "var(--font-body)",
        }}
      >
        {cancelText}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 };

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
