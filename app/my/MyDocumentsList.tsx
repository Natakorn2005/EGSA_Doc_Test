"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { colors } from "@/lib/theme";
import DocumentDetailModal, { STATUS_META, DetailDoc } from "@/components/DocumentDetailModal";

export type MyDoc = DetailDoc;

export default function MyDocumentsList({ docs }: { docs: MyDoc[] }) {
  const t = useTranslations("my");
  const ts = useTranslations("status");
  const [selected, setSelected] = useState<MyDoc | null>(null);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {docs.map((doc) => {
          const meta = STATUS_META[doc.status] || { key: "", color: "#444", bg: "#f5f5f5" };
          return (
            <button
              key={doc.trackingId}
              onClick={() => setSelected(doc)}
              style={{
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: 10,
                padding: 16,
                background: meta.bg,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                width: "100%",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.docName || doc.trackingId}
                </div>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {doc.trackingId} · {t("submittedAt")}: {doc.submittedAt || "-"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span
                  style={{
                    background: "#fff",
                    color: meta.color,
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {meta.key ? ts(meta.key) : doc.status}
                </span>
                <i className="ti ti-chevron-right" style={{ fontSize: 18, color: colors.textMuted }} aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>

      {selected && <DocumentDetailModal doc={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
