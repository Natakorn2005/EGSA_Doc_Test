import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "secretary" | "president" | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "secretary" | "president" | null;
  }
}
