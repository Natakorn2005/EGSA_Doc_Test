import { auth, signOut } from "@/auth";
import { getStaffRole, isSignerRole, isSecretaryRole, getRoleI18nKey } from "@/lib/roles";
import { colors, layout } from "@/lib/theme";
import { getTranslations } from "next-intl/server";
import Sidebar from "./Sidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import Footer from "./Footer";

type NavLink = { href: string; icon: string; label: string };

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user?.email) {
    return (
      <>
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 40 }}>
          <LanguageSwitcher variant="onLight" />
        </div>
        {children}
        <Footer />
      </>
    );
  }

  const role = await getStaffRole(session.user.email);
  const roleLabel = t(`role.${getRoleI18nKey(role)}`);
  const displayName = session.user.name || session.user.email;
  const isStaff = isSecretaryRole(role) || isSignerRole(role);

  const links: NavLink[] = [{ href: "/", icon: "ti-home", label: t("nav.home") }];
  if (isSecretaryRole(role)) {
    links.push({ href: "/secretary", icon: "ti-inbox", label: t("nav.secretaryQueue") });
  }
  if (isSignerRole(role)) {
    links.push({ href: "/president", icon: "ti-checkbox", label: t("nav.presidentQueue") });
  }
  if (isStaff) {
    links.push({ href: "/records", icon: "ti-database", label: t("records.navLabel") });
    links.push({ href: "/registry", icon: "ti-notebook", label: t("registry.navLabel") });
  }
  links.push({ href: "/submit", icon: "ti-file-plus", label: t("nav.submit") });
  links.push({ href: "/status", icon: "ti-search", label: t("nav.status") });
  links.push({ href: "/my", icon: "ti-folder", label: t("nav.myDocs") });
  links.push({ href: "/profile", icon: "ti-user", label: t("nav.profile") });
  links.push({ href: "/faq", icon: "ti-message-circle-question", label: t("faq.navLabel") });
  if (isStaff) {
    links.push({ href: "/help", icon: "ti-help-circle", label: t("help.navLabel") });
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.pageBg }}>
      <Sidebar
        orgName={t("nav.orgShort")}
        displayName={displayName}
        roleLabel={roleLabel}
        links={links}
        signOutText={t("nav.signOut")}
        signOutAction={handleSignOut}
      />
      <div className="egsa-main" style={{ marginLeft: layout.sidebarWidth }}>
        <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "28px 24px" }}>
          {children}
        </div>
        <Footer />
      </div>
      <style>{`
        @media (max-width: 768px) {
          .egsa-main { margin-left: 0 !important; padding-top: 12px; }
        }
      `}</style>
    </div>
  );
}