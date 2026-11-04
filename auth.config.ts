import type { NextAuthConfig } from "next-auth";
import { isSecretaryRole, isSignerRole, isEducationRole } from "@/lib/roles";

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role || null;
      if (nextUrl.pathname.startsWith("/secretary")) return isSecretaryRole(role);
      if (nextUrl.pathname.startsWith("/president")) return isSignerRole(role);
      if (nextUrl.pathname.startsWith("/education")) return isEducationRole(role);
      if (nextUrl.pathname.startsWith("/upload-signed")) return !!auth?.user;
      if (nextUrl.pathname.startsWith("/registry")) return isSecretaryRole(role) || isSignerRole(role);
      if (nextUrl.pathname.startsWith("/records") || nextUrl.pathname.startsWith("/help")) {
        return isSecretaryRole(role) || isSignerRole(role) || isEducationRole(role);
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;