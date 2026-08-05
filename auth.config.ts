import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      if (nextUrl.pathname.startsWith("/secretary")) return role === "secretary";
      if (nextUrl.pathname.startsWith("/president")) return role === "president";
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
