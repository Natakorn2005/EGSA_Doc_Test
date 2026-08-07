"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { colors, cardStyle } from "@/lib/theme";

export type RegistryRow = {
  docNumber: string;
  issuedAt: string;
  trackingId: string;
  title: string;
  sender: string;
  approver: string;
  fileUrl: string;
};

export default function RegistryTable({ rows }: { rows: RegistryRow[] }) {
  const t = useTranslations("registry");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.docNumber.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.sender.toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (rows.length === 0) {
    return (
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
        <i className="ti ti-notebook-off" style={{ fontSize: 32, color: colors.textMuted }} aria-hidden="true" />
        <p style={{ margin: "10px 0 0", fontSize: 14 }}>{t("empty")}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <i
          className="ti ti-search"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
            color: colors.textMuted,
          }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 38px",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 10,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
      </div>

      <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
        {filtered.length} {t("resultsCount")}
      </p>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: colors.textSecondary,
            background: "#fff",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12,
          }}
        >
          <i className="ti ti-search-off" style={{ fontSize: 28, color: colors.textMuted }} aria-hidden="true" />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((r, i) => (
          <div
            key={i}
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: colors.tint,
                color: colors.primary,
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 500,
                fontSize: 14,
                whiteSpace: "nowrap",
                flexShrink: 0,
                minWidth: 130,
                textAlign: "center",
              }}
            >
              {r.docNumber || "-"}
            </div>

            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.title || "-"}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {t("colSender")}: {r.sender || "-"} · {t("colApprover")}: {r.approver || "-"}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {t("colIssuedAt")}: {r.issuedAt || "-"} ·{" "}
                <a href={`/status?q=${encodeURIComponent(r.trackingId)}`} style={{ color: colors.textMuted }}>
                  {r.trackingId}
                </a>
              </div>
            </div>

            {r.fileUrl ? (
              <a
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="egsa-link-btn"
                style={{ flexShrink: 0 }}
              >
                <i className="ti ti-file-check" style={{ fontSize: 16 }} aria-hidden="true" />
                {t("openApprovedFile")}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>{t("noFileLink")}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}