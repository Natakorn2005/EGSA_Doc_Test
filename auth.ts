import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { getStaffRole } from "@/lib/roles";
import type { StaffRole } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = await getStaffRole(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // *** แก้ type ให้ครบทุกบทบาท (เดิมมีแค่ secretary/president ตกไป 3 ตัว) ***
        session.user.role = (token.role as StaffRole) ?? null;
      }
      return session;
    },
  },
  session: {
    // *** ลดจาก 8 ชม. เหลือ 2 ชม. ***
    // เหตุผล: เจ้าหน้าที่อาจล็อกอินบนคอมสาธารณะ (ห้องสมุด/แล็บ) แล้วลืม logout
    // session สั้นลง = หน้าต่างที่คนถัดไปใช้สิทธิ์ต่อได้แคบลงมาก
    maxAge: 2 * 60 * 60,

    // *** ต่ออายุ session ทุกครั้งที่มีการใช้งานจริง (rolling session) ***
    // คนที่ใช้งานต่อเนื่องจะไม่ถูกเตะออกกลางคัน แต่คนที่เดินจากไปเฉย ๆ จะหมดอายุใน 2 ชม.
    updateAge: 15 * 60,
  },
});