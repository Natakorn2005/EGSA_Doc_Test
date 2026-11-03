import { auth, signIn } from "@/auth";
import { getUserProfile } from "@/lib/profile";
import { getLatestApplicantInfo } from "@/lib/applicantHistory";
import { getTranslations } from "next-intl/server";
import { colors, buttonPrimaryStyle } from "@/lib/theme";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const t = await getTranslations("profile");
  const tn = await getTranslations("nav");

  if (!session?.user?.email) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px" }}>
        <h1 style={{ fontSize: 20, color: colors.text, marginBottom: 8 }}>{t("title")}</h1>
        <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 }}>{t("loginPrompt")}</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/profile" });
          }}
        >
          <button type="submit" style={buttonPrimaryStyle}>
            {tn("signIn")}
          </button>
        </form>
      </div>
    );
  }

  // ลองหาจากโปรไฟล์ที่บันทึกไว้ก่อน ถ้ายังไม่มีค่อย fallback ไปดูจากการยื่นเอกสารครั้งล่าสุด
  const existingProfile = await getUserProfile(session.user.email);
  const history = existingProfile ? null : await getLatestApplicantInfo(session.user.email);

  const initial = existingProfile || {
    name: history?.name || session.user.name || "",
    studentId: history?.studentId || "",
    phone: history?.phone || "",
    pdpaConsentDate: "",
  };

  return (
    <ProfileForm
      email={session.user.email}
      initialName={initial.name}
      initialStudentId={initial.studentId}
      initialPhone={initial.phone}
      hasSavedProfile={!!existingProfile}
      pdpaConsentDate={initial.pdpaConsentDate}
    />
  );
}
