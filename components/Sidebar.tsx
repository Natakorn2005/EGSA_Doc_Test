"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { colors, layout } from "@/lib/theme";
import LanguageSwitcher from "./LanguageSwitcher";

type NavLink = { href: string; icon: string; label: string };

export default function Sidebar({
  orgName,
  displayName,
  roleLabel,
  links,
  signOutText,
  signOutAction,
}: {
  orgName: string;
  displayName: string | null;
  roleLabel: string | null;
  links: NavLink[];
  signOutText: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebarInner = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: 4,
            }}
          >
            <img
              src="/egsa-logo.png"
              alt="EGSA"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <span style={{ color: "#fff", fontSize: 13, lineHeight: 1.3 }}>{orgName}</span>
        </div>
        <LanguageSwitcher />
      </div>

      <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                color: active ? "#fff" : "#F3D0D4",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
              }}
            >
              <i className={`ti ${link.icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
              {link.label}
            </a>
          );
        })}
      </nav>

      <div style={{ padding: "16px 18px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        {displayName && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{displayName}</div>
            {roleLabel && <div style={{ color: "#F3D0D4", fontSize: 12 }}>{roleLabel}</div>}
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-body)",
            }}
          >
            {signOutText}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className="egsa-menu-btn"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 30,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: colors.primary,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "none",
        }}
      >
        <i className="ti ti-menu-2" style={{ fontSize: 20 }} aria-hidden="true" />
      </button>

      <aside
        className="egsa-sidebar"
        style={{
          width: layout.sidebarWidth,
          background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 20,
        }}
      >
        {sidebarInner}
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="egsa-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 19,
            display: "none",
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .egsa-sidebar { transform: translateX(${open ? "0" : "-100%"}); transition: transform 0.2s; }
          .egsa-menu-btn { display: flex !important; align-items: center; justify-content: center; }
          .egsa-overlay { display: ${open ? "block" : "none"} !important; }
        }
      `}</style>
    </>
  );
}