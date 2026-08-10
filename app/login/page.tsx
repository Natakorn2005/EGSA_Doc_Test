import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { colors, buttonPrimaryStyle } from "@/lib/theme";

export default async function LoginPage() {
  const t = await getTranslations("login");
  const tn = await getTranslations("nav");

  // *** ถ้าล็อกอินอยู่แล้ว ไม่ต้องแสดงหน้านี้ซ้ำ ส่งไปหน้าแรกทันที ***
  // กันกรณีมีคนเข้าหน้านี้ตรง ๆ ทั้งที่มี session อยู่แล้ว (เช่นกดย้อนกลับ หรือกด bookmark เก่า)
  const session = await auth();
  if (session?.user?.email) {
    redirect("/");
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, color: colors.text }}>{t("title")}</h1>
      <form
        action={async () => {
          "use server";
          // *** ระบุปลายทางชัดเจนหลังล็อกอินสำเร็จ — เดิมไม่ได้ระบุ ทำให้ค่าเริ่มต้น
          // อาจย้อนกลับมาที่หน้า /login เอง (หน้าที่เรียก signIn) แทนที่จะไปหน้าแรก ***
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button type="submit" style={{ ...buttonPrimaryStyle, marginTop: 12 }}>
          {tn("signIn")}
        </button>
      </form>
    </div>
  );
}