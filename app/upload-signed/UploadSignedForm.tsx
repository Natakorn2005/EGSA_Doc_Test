"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { colors, buttonPrimaryStyle } from "@/lib/theme";
import { useSendQueue, useSendJob } from "@/components/SendQueue";

type Doc = {
  trackingId: string;
  docName: string;
  eduNumber: string;
  eduWordUrl: string;
  eduPdfUrl: string;
  eduPdfHash: string;
  sharePending: boolean;
  /** มีค่า = ส่งฉบับเซ็นใหม่หลังถูกตีกลับแบบเล็ก (ได้รหัสรอบใหม่) */
  resubmitOf: string;
  rejectReason: string;
  rejectBy: string;
  rejectFileUrl: string;
};

const MAX_SIZE = 3 * 1024 * 1024;

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function UploadSignedForm({ doc }: { doc: Doc }) {
  const t = useTranslations("uploadSigned");
  const tc = useTranslations("common");
  const { enqueue, dismiss } = useSendQueue();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useSendJob(jobId);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(picked: File | null) {
    setError("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (!picked) return;
    if (picked.size > MAX_SIZE) return setError(t("fileTooLarge"));
    if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") return setError(t("mustBePdf"));
    // เทียบกับ PDF ที่การศึกษาส่งคืน — เหมือนกันทุกไบต์แปลว่ายังไม่ได้เซ็น
    if (doc.eduPdfHash) {
      setChecking(true);
      try {
        if ((await sha256Hex(picked)) === doc.eduPdfHash) return setError(t("sameAsEduFile"));
      } catch {
        // เบราว์เซอร์คำนวณไม่ได้ — ปล่อยให้ Apps Script เช็คซ้ำตอนส่งแทน
      } finally {
        setChecking(false);
      }
    }
    setFile(picked);
  }

  function send() {
    if (!file) return setError(t("pleaseChoose"));
    if (jobId) dismiss(jobId);
    const fd = new FormData();
    if (doc.resubmitOf) fd.append("resubmitOf", doc.resubmitOf);
    else fd.append("trackingId", doc.trackingId);
    fd.append("file", file);
    setJobId(
      enqueue({
        kind: "uploadSigned",
        label: doc.docName || doc.trackingId,
        trackingId: doc.trackingId,
        request: { endpoint: "/api/upload-signed", body: fd },
      })
    );
  }

  if (job?.status === "done") {
    return (
      <div style={{ background: colors.tint, border: `1px solid ${colors.tintBorder}`, borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 18, color: colors.primaryDark, margin: "0 0 8px" }}>{t("successTitle")}</h2>
        <p style={{ margin: "0 0 12px", fontSize: 14 }}>{t("successBody")}</p>
        {doc.resubmitOf && job.result?.trackingId && (
          <p style={{ background: "#fff", padding: 12, borderRadius: 6, fontSize: 14, margin: "0 0 12px" }}>
            {t("newTrackingId")}
            <br />
            <strong style={{ fontSize: 18 }}>{job.result.trackingId}</strong>
          </p>
        )}
        <Link href="/my" style={{ color: colors.primary, fontSize: 13 }}>
          {t("goMyDocs")}
        </Link>
      </div>
    );
  }

  const sending = job?.status === "sending";
  const shownError = job?.status === "error" ? job.error || "" : error;

  return (
    <div>
      <div style={{ background: "#fff", border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500, overflowWrap: "anywhere" }}>{doc.docName || doc.trackingId}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
          {doc.trackingId}
          {doc.eduNumber ? ` · ${doc.eduNumber}` : ""}
        </div>
        {doc.sharePending ? (
          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: colors.textSecondary, margin: "12px 0 0" }}>
            <i className="ti ti-hourglass" style={{ fontSize: 15 }} aria-hidden="true" />
            {tc("filePreparing")}
          </p>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {doc.eduWordUrl && (
              <a href={doc.eduWordUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                <i className="ti ti-file-word" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("eduWord")}
              </a>
            )}
            {doc.eduPdfUrl && (
              <a href={doc.eduPdfUrl} target="_blank" rel="noopener noreferrer" className="egsa-link-btn">
                <i className="ti ti-file-type-pdf" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("eduPdf")}
              </a>
            )}
          </div>
        )}
      </div>

      {doc.resubmitOf && (
        <div style={{ background: colors.tint, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: colors.primaryDark, marginBottom: 14, lineHeight: 1.6 }}>
          <strong style={{ display: "block", marginBottom: 2 }}>
            {t("rejectedBy", { by: doc.rejectBy || "-" })}
          </strong>
          {doc.rejectReason}
          {doc.rejectFileUrl && (
            <div style={{ marginTop: 6 }}>
              <a href={doc.rejectFileUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
                {t("rejectFile")}
              </a>
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 12, color: colors.textSecondary }}>{t("resubmitNote")}</div>
        </div>
      )}

      <div style={{ background: "#f2edf9", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#5b3c8c", marginBottom: 14, lineHeight: 1.6 }}>
        <i className="ti ti-signature" style={{ marginRight: 6 }} aria-hidden="true" />
        {t("mustBeSigned")}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => void pick(e.target.files?.[0] || null)}
        style={{ display: "none" }}
      />
      <div
        onClick={() => !sending && fileRef.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          border: `1px dashed ${colors.tintBorder}`,
          borderRadius: 8,
          cursor: sending ? "default" : "pointer",
          background: colors.tint,
        }}
      >
        <i className="ti ti-upload" style={{ fontSize: 18, color: colors.primary }} aria-hidden="true" />
        <span style={{ fontSize: 13, color: file ? colors.primaryDark : colors.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {checking ? t("checking") : file ? file.name : t("chooseFile")}
        </span>
      </div>
      <p style={{ fontSize: 11, color: colors.textMuted, margin: "6px 0 14px" }}>{t("fileHint")}</p>

      {shownError && <p style={{ color: "#b00020", fontSize: 13, margin: "0 0 12px" }}>{shownError}</p>}

      <button
        onClick={send}
        disabled={sending || checking}
        style={{ ...buttonPrimaryStyle, width: "100%", opacity: sending || checking ? 0.7 : 1 }}
      >
        {sending ? t("sending") : t("submitButton")}
      </button>
    </div>
  );
}
