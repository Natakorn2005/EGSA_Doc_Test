import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isSecretaryRole, isSignerRole, isEducationRole } from "@/lib/roles";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSecretaryPath = nextUrl.pathname.startsWith("/secretary");
  const isPresidentPath = nextUrl.pathname.startsWith("/president");
  const isRecordsPath = nextUrl.pathname.startsWith("/records");
  const isRegistryPath = nextUrl.pathname.startsWith("/registry");
  const isHelpPath = nextUrl.pathname.startsWith("/help");
  const isEducationPath = nextUrl.pathname.startsWith("/education");
  // หน้าอัปโหลดฉบับเซ็นของผู้ยื่น — ต้องเข้าสู่ระบบ (เทียบอีเมลกับเอกสารที่ Apps Script)
  const isUploadSignedPath = nextUrl.pathname.startsWith("/upload-signed");

  if (!isSecretaryPath && !isPresidentPath && !isRecordsPath && !isRegistryPath && !isHelpPath && !isEducationPath && !isUploadSignedPath) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    if (isUploadSignedPath) loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  if (isUploadSignedPath) return NextResponse.next();

  const denied =
    (isSecretaryPath && !isSecretaryRole(role || null)) ||
    (isPresidentPath && !isSignerRole(role || null)) ||
    (isEducationPath && !isEducationRole(role || null)) ||
    (isRegistryPath && !isSecretaryRole(role || null) && !isSignerRole(role || null)) ||
    ((isRecordsPath || isHelpPath) &&
      !isSecretaryRole(role || null) &&
      !isSignerRole(role || null) &&
      !isEducationRole(role || null));

  if (denied) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/secretary/:path*",
    "/president/:path*",
    "/records/:path*",
    "/registry/:path*",
    "/help/:path*",
    "/education/:path*",
    "/upload-signed/:path*",
  ],
};
