import { auth, signOut } from "@/auth";
import { getStaffRole, getRoleDisplayLabel, isSignerRole } from "@/lib/roles";
import { colors, layout } from "@/lib/theme";
import Sidebar from "./Sidebar";

type NavLink = { href: string; icon: string; label: string };

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // ผู้ที่ยังไม่ล็อกอิน ไม่ต้องมี sidebar — แสดงเนื้อหาเต็มพื้นที่ (หน้า login/submit/status สาธารณะ)
  if (!session?.user?.email) {
    return (
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "24px 20px" }}>
        {children}
      </div>
    );
  }

  const role = await getStaffRole(session.user.email);
  const roleLabel = getRoleDisplayLabel(role);
  const displayName = session.user.name || session.user.email;

  const links: NavLink[] = [{ href: "/", icon: "ti-home", label: "หน้าแรก" }];
  if (role === "secretary") {
    links.push({ href: "/secretary", icon: "ti-inbox", label: "คิวเอกสารรอตรวจ" });
  }
  if (isSignerRole(role)) {
    links.push({ href: "/president", icon: "ti-checkbox", label: "คิวเอกสารรอเซ็น" });
  }
  links.push({ href: "/submit", icon: "ti-file-plus", label: "ยื่นเอกสาร" });
  links.push({ href: "/status", icon: "ti-search", label: "ตรวจสอบสถานะ" });
  links.push({ href: "/my", icon: "ti-folder", label: "เอกสารของฉัน" });
  links.push({ href: "/profile", icon: "ti-user", label: "ข้อมูลส่วนตัว" });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.pageBg }}>
      <Sidebar
        displayName={displayName}
        roleLabel={roleLabel}
        links={links}
        signOutAction={handleSignOut}
      />
      <div className="egsa-main" style={{ marginLeft: layout.sidebarWidth }}>
        <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "28px 24px" }}>
          {children}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .egsa-main { margin-left: 0 !important; padding-top: 12px; }
        }
      `}</style>
    </div>
  );
}