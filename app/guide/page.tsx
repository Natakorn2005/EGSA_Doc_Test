import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { getStaffRole, isSecretaryRole, isSignerRole } from "@/lib/roles";
import { colors } from "@/lib/theme";
import GuideBlocks, { type GuideContent } from "@/components/guide/GuideBlocks";
import guideTh from "@/messages/guide/th.json";
import guideEn from "@/messages/guide/en.json";

export const dynamic = "force-dynamic";

// คู่มือการใช้งาน — เนื้อหาทั้งหมดอยู่ใน messages/guide/th.json และ en.json
// ภาพหน้าจออยู่ใน public/guide/th, public/guide/en และ public/guide/shared (อีเมล/LINE/ป๊อปอัปชีต ซึ่งเป็นภาษาไทยอย่างเดียว)
// แท็บเลขานุการและนายกสโมสรแสดงเฉพาะคนที่อยู่ในแท็บ "เจ้าหน้าที่"

const ALL_TABS = ["overview", "tour", "applicant", "secretary", "president"] as const;
type Tab = (typeof ALL_TABS)[number];
const STAFF_TABS: Tab[] = ["secretary", "president"];

function pickContent(locale: string): GuideContent {
  return (locale === "en" ? guideEn : guideTh) as GuideContent;
}

export async function generateMetadata(): Promise<Metadata> {
  const content = pickContent(await getLocale());
  return { title: content.meta.title };
}

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const content = pickContent(locale);

  const session = await auth();
  const email = session?.user?.email as string | undefined;
  const role = email ? await getStaffRole(email) : null;
  const isStaff = isSecretaryRole(role) || isSignerRole(role);

  const tabs = ALL_TABS.filter((t) => isStaff || !STAFF_TABS.includes(t));
  const roleTab: Tab = isSecretaryRole(role) ? "secretary" : isSignerRole(role) ? "president" : email ? "applicant" : "overview";
  const requested = params.tab as Tab | undefined;
  const active: Tab = requested && tabs.includes(requested) ? requested : roleTab;

  const blocks = (content.sections[active] || []).filter((b) => isStaff || !b.staffOnly);
  const headings = blocks.filter((b) => b.type === "h2" && b.id);

  const page = (
    <div className="guide-root" style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) { .egsa-main .guide-root { padding-top: 40px; } }
        @media (max-width: 660px) { .guide-scroll-hint { display: inline !important; } }
      `}</style>
      <h1 style={{ fontSize: 22, margin: "0 0 4px", fontFamily: "var(--font-heading)" }}>{content.meta.title}</h1>
      <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 18px" }}>{content.meta.subtitle}</p>

      <nav
        aria-label={content.meta.title}
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 2,
          borderBottom: `1px solid ${colors.cardBorder}`,
          marginBottom: 18,
        }}
      >
        {tabs.map((t) => {
          const on = t === active;
          return (
            <Link
              key={t}
              href={`/guide?tab=${t}`}
              aria-current={on ? "page" : undefined}
              style={{
                whiteSpace: "nowrap",
                padding: "9px 14px",
                fontSize: 14,
                textDecoration: "none",
                color: on ? colors.primary : colors.textSecondary,
                fontWeight: on ? 600 : 400,
                borderBottom: `3px solid ${on ? colors.primary : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {content.tabs[t]}
              {t === roleTab && email && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 10,
                    background: colors.tint,
                    color: colors.primaryDark,
                    fontWeight: 500,
                  }}
                >
                  {content.meta.yourTab}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!isStaff && (active === "overview" || active === "tour") && (
        <p style={{ fontSize: 12.5, color: colors.textMuted, margin: "0 0 14px" }}>{content.meta.staffOnlyNote}</p>
      )}

      {headings.length > 2 && (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12.5, color: colors.textSecondary, marginBottom: 6 }}>{content.meta.onThisPage}</div>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.9, columns: "2 220px", columnGap: 24 }}>
            {headings.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} style={{ color: colors.primary, textDecoration: "none" }}>
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      <GuideBlocks blocks={blocks} content={content} locale={locale} />

      <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", margin: "32px 0 8px" }}>{content.meta.sampleNote}</p>
    </div>
  );

  // หน้าที่เปิดได้โดยไม่เข้าสู่ระบบไม่มีเมนูซ้าย จึงต้องเว้นขอบและมีทางกลับหน้าแรกเอง
  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: colors.pageBg, padding: "56px 20px 28px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto 14px" }}>
          <Link href="/" style={{ fontSize: 13, color: colors.primary, textDecoration: "none" }}>
            ← {content.meta.backHome}
          </Link>
        </div>
        {page}
      </div>
    );
  }
  return page;
}
