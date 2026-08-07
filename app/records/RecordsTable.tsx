"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { colors } from "@/lib/theme";
import { getMonthKey } from "@/lib/dateFormat";
import DocumentDetailModal from "@/components/DocumentDetailModal";

export type RecordRow = {
  trackingId: string;
  docName: string;
  applicant: string;
  agency: string;
  status: string;
  submittedAt: string;
  docNumber: string;
  reviewedAt: string;
  approvedAt: string;
  reviewer: string;
  approver: string;
  rejectReason: string;
  fileUrl: string;
  finalFileUrl: string;
  resubmitLink: string;
};

const STATUS_META: Record<string, { key: string; color: string; bg: string }> = {
  "รอตรวจสอบ": { key: "statusPending", color: "#665c00", bg: "#fff8e1" },
  "รอเซ็น": { key: "statusWaitingSign", color: "#8a4b00", bg: "#fff3e0" },
  "อนุมัติ": { key: "statusApproved", color: "#1b5e20", bg: "#f1f8f1" },
  "ตีกลับ": { key: "statusRejected", color: colors.primaryDark, bg: colors.tint },
};

export default function RecordsTable({
  records,
  months,
}: {
  records: RecordRow[];
  months: { key: string; label: string }[];
}) {
  const t = useTranslations("records");
  const ts = useTranslations("status");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [selected, setSelected] = useState<RecordRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (monthFilter && getMonthKey(r.submittedAt) !== monthFilter) return false;
      if (!q) return true;
      return (
        r.docName.toLowerCase().includes(q) ||
        r.applicant.toLowerCase().includes(q) ||
        r.trackingId.toLowerCase().includes(q)
      );
    });
  }, [records, search, statusFilter, monthFilter]);

  const statuses = Array.from(new Set(records.map((r) => r.status).filter(Boolean)));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "8px 12px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "var(--font-body)",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "var(--font-body)",
            background: "#fff",
          }}
        >
          <option value="">{t("allStatuses")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s] ? ts(STATUS_META[s].key) : s}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8,
            fontSize: 14,
            fontFamily: "var(--font-body)",
            background: "#fff",
          }}
        >
          <option value="">{t("allMonths")}</option>
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
        {filtered.length} {t("resultsCount")}
      </p>

      <div style={{ overflowX: "auto", border: `1px solid ${colors.cardBorder}`, borderRadius: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr>
              {[
                t("colTrackingId"),
                t("colDocName"),
                t("colApplicant"),
                t("colAgency"),
                t("colStatus"),
                t("colSubmitted"),
                t("colReviewed"),
                t("colApproved"),
                t("colDocNumber"),
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "#faf5f5",
                    color: colors.textSecondary,
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const meta = STATUS_META[r.status];
              return (
                <tr
                  key={i}
                  onClick={() => setSelected(r)}
                  style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", cursor: "pointer" }}
                >
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap", color: colors.primary }}>
                    {r.trackingId}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{r.docName || "-"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{r.applicant || "-"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>{r.agency || "-"}</td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                    {meta ? (
                      <span
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          fontSize: 12,
                          padding: "2px 9px",
                          borderRadius: 20,
                        }}
                      >
                        {ts(meta.key)}
                      </span>
                    ) : (
                      r.status || "-"
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                    {r.submittedAt || "-"}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                    {r.reviewedAt || "-"}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                    {r.approvedAt || "-"}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>
                    {r.docNumber || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <DocumentDetailModal doc={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}