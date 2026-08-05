import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { getStaffRole } from "@/lib/roles";

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
        session.user.role = (token.role as "secretary" | "president" | null) ?? null;
      }
      return session;
    },
  },
  session: {
    maxAge: 8 * 60 * 60,
  },
});
