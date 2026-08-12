import type { NextAuthConfig } from "next-auth";
import { isSecretaryRole, isSignerRole } from "@/lib/roles";

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role || null;
      if (nextUrl.pathname.startsWith("/secretary")) return isSecretaryRole(role);
      if (nextUrl.pathname.startsWith("/president")) return isSignerRole(role);
      if (
        nextUrl.pathname.startsWith("/records") ||
        nextUrl.pathname.startsWith("/registry") ||
        nextUrl.pathname.startsWith("/help")
      ) {
        return isSecretaryRole(role) || isSignerRole(role);
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;