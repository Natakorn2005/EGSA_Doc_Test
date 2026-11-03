// แสดงเนื้อหาคู่มือจาก messages/guide/*.json
// ข้อความในไฟล์ใช้รูปแบบย่อได้ 3 แบบ: **ตัวหนา**, `ชื่อไฟล์หรือรหัส`, [ข้อความลิงก์](ที่อยู่ลิงก์)
import Link from "next/link";
import { colors } from "@/lib/theme";
import FlowDiagram from "./FlowDiagram";

export type GuideStep = { text: string; img?: string; alt?: string; shared?: boolean };
export type GuideBlock = {
  type: "h2" | "h3" | "p" | "note" | "ul" | "steps" | "img" | "table" | "diagram";
  id?: string;
  staffOnly?: boolean;
  text?: string;
  tone?: "info" | "warn";
  items?: (string | GuideStep)[];
  src?: string;
  alt?: string;
  shared?: boolean;
  caption?: string;
  head?: string[];
  rows?: string[][];
};
export type GuideContent = {
  meta: Record<string, string>;
  tabs: Record<string, string>;
  diagrams: Record<string, Record<string, string>>;
  sections: Record<string, GuideBlock[]>;
};

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code key={i} style={{ background: "#f4eeee", borderRadius: 4, padding: "1px 5px", fontSize: "0.92em", wordBreak: "break-word" }}>
              {part.slice(1, -1)}
            </code>
          );
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const style = { color: colors.primary, textDecoration: "underline" };
          if (href.startsWith("/")) return <Link key={i} href={href} style={style}>{label}</Link>;
          const external = href.startsWith("http");
          return (
            <a key={i} href={href} style={style} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {label}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function imageSrc(locale: string, name: string, shared?: boolean) {
  return `/guide/${shared ? "shared" : locale}/${name}.webp`;
}

function Shot({ src, alt, caption, openFull }: { src: string; alt: string; caption?: string; openFull: string }) {
  return (
    <figure style={{ margin: "14px auto 18px", textAlign: "center", maxWidth: "100%" }}>
      <a href={src} target="_blank" rel="noopener noreferrer" title={openFull} style={{ display: "inline-block", maxWidth: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            borderRadius: 10,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: "0 2px 10px rgba(74,13,24,0.08)",
            background: "#fff",
          }}
        />
      </a>
      <figcaption style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
        {caption || alt}
      </figcaption>
    </figure>
  );
}

const textStyle = { fontSize: 14, lineHeight: 1.85, color: colors.text, margin: "0 0 12px" };

export default function GuideBlocks({
  blocks,
  content,
  locale,
}: {
  blocks: GuideBlock[];
  content: GuideContent;
  locale: string;
}) {
  const openFull = content.meta.openFull;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={b.id}
                style={{
                  fontSize: 18,
                  margin: "36px 0 12px",
                  paddingBottom: 8,
                  borderBottom: `2px solid ${colors.tint}`,
                  color: colors.primaryDark,
                  scrollMarginTop: 16,
                }}
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} style={{ fontSize: 15, margin: "24px 0 8px", color: colors.text }}>
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} style={textStyle}>
                <Inline text={b.text || ""} />
              </p>
            );
          case "note": {
            const warn = b.tone === "warn";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  background: warn ? "#fff8e1" : colors.tint,
                  border: `1px solid ${warn ? "#f0d98a" : colors.tintBorder}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  margin: "4px 0 16px",
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  color: warn ? "#5c4a00" : colors.primaryDark,
                }}
              >
                <i className={`ti ${warn ? "ti-alert-triangle" : "ti-info-circle"}`} style={{ fontSize: 18, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <Inline text={b.text || ""} />
                </div>
              </div>
            );
          }
          case "ul":
            return (
              <ul key={i} style={{ ...textStyle, paddingLeft: 22 }}>
                {(b.items as string[]).map((it, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={i} style={{ listStyle: "none", padding: 0, margin: "8px 0 16px" }}>
                {(b.items as GuideStep[]).map((s, j) => (
                  <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: s.img ? 6 : 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: colors.primary,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 1,
                      }}
                    >
                      {j + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, lineHeight: 1.85, color: colors.text }}>
                        <Inline text={s.text} />
                      </div>
                      {s.img && <Shot src={imageSrc(locale, s.img, s.shared)} alt={s.alt || ""} openFull={openFull} />}
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "img":
            return <Shot key={i} src={imageSrc(locale, b.src || "", b.shared)} alt={b.alt || ""} caption={b.caption} openFull={openFull} />;
          case "table":
            return (
              <div key={i} style={{ overflowX: "auto", margin: "8px 0 18px", border: `1px solid ${colors.cardBorder}`, borderRadius: 10, background: "#fff" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13, lineHeight: 1.65 }}>
                  <thead>
                    <tr>
                      {b.head?.map((h, j) => (
                        <th
                          key={j}
                          style={{
                            textAlign: "left",
                            padding: "9px 12px",
                            background: "#faf5f5",
                            color: colors.textSecondary,
                            fontWeight: 600,
                            borderBottom: `1px solid ${colors.cardBorder}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows?.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            style={{
                              padding: "9px 12px",
                              borderBottom: r === (b.rows?.length || 0) - 1 ? "none" : `1px solid ${colors.cardBorder}`,
                              verticalAlign: "top",
                              minWidth: c === 0 ? 120 : 90,
                            }}
                          >
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "diagram":
            return (
              <figure key={i} style={{ margin: "12px 0 18px" }}>
                <div className="guide-diagram" style={{ overflowX: "auto", border: `1px solid ${colors.cardBorder}`, borderRadius: 10, background: "#fff", padding: "4px 0" }}>
                  <div style={{ minWidth: 620 }}>
                    <FlowDiagram id={b.id || ""} labels={content.diagrams[b.id || ""] || {}} />
                  </div>
                </div>
                <figcaption style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 8, lineHeight: 1.6, textAlign: "center" }}>
                  <span className="guide-scroll-hint" style={{ display: "none", color: colors.textMuted }}>
                    ↔ {content.meta.scrollHint}
                    <br />
                  </span>
                  {b.caption}
                </figcaption>
              </figure>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
