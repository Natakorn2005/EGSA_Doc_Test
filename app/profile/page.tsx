import { auth, signIn } from "@/auth";
import { getUserProfile } from "@/lib/profile";
import { getLatestApplicantInfo } from "@/lib/applicantHistory";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>ข้อมูลส่วนตัว</h1>
        <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
          เข้าสู่ระบบด้วย Google เพื่อบันทึกข้อมูลส่วนตัวไว้ใช้เติมฟอร์มอัตโนมัติ
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/profile" });
          }}
        >
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#2e7d32",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </form>
      </main>
    );
  }

  // ลองหาจากโปรไฟล์ที่บันทึกไว้ก่อน ถ้ายังไม่มีค่อย fallback ไปดูจากการยื่นเอกสารครั้งล่าสุด
  // (เผื่อคนที่เคยยื่นเอกสารมาก่อนหน้านี้ แต่ยังไม่เคยมาหน้านี้)
  const existingProfile = await getUserProfile(session.user.email);
  const history = existingProfile ? null : await getLatestApplicantInfo(session.user.email);

  const initial = existingProfile || {
    name: history?.name || session.user.name || "",
    studentId: history?.studentId || "",
    phone: history?.phone || "",
  };

  return (
    <ProfileForm
      email={session.user.email}
      initialName={initial.name}
      initialStudentId={initial.studentId}
      initialPhone={initial.phone}
      hasSavedProfile={!!existingProfile}
    />
  );
}