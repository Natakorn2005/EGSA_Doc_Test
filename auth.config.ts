import type { NextAuthConfig } from "next-auth";

const SIGNER_ROLES = ["president", "vp_internal", "vp_external"];

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      if (nextUrl.pathname.startsWith("/secretary")) return role === "secretary";
      if (nextUrl.pathname.startsWith("/president")) return SIGNER_ROLES.includes(role || "");
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;