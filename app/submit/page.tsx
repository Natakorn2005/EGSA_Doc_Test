import { auth } from "@/auth";
import { getAgencyOptions } from "@/lib/agencies";
import { getUserProfile } from "@/lib/profile";
import { getLatestApplicantInfo } from "@/lib/applicantHistory";
import { redirect } from "next/navigation";
import { getSecretarySheet } from "@/lib/googleSheets";
import SubmitFlow from "./SubmitFlow";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const agencyOptions = await getAgencyOptions();
  const params = await searchParams;
  const session = await auth();

  const isResubmit = !!params.previousTrackingId;

  // *** รอบก่อนถูกตีกลับแบบเล็ก: ไม่ต้องยื่น Word ใหม่ — พาไปหน้าอัปโหลดฉบับเซ็นใหม่แทน ***
  if (isResubmit) {
    let smallReject = false;
    try {
      const { headers, rows } = await getSecretarySheet();
      const idCol = headers.indexOf("Tracking ID");
      const typeCol = headers.indexOf("แบบการตีกลับ");
      const prev = rows.find((r) => (r[idCol] || "").trim() === params.previousTrackingId!.trim());
      smallReject = typeCol !== -1 && !!prev && prev[typeCol] === "เล็ก";
    } catch {
      // อ่านชีตไม่ได้ ให้ยื่นตามปกติ — Apps Script ปฏิเสธเองถ้าเป็นแบบเล็ก
    }
    if (smallReject) redirect(`/upload-signed?resubmit=${encodeURIComponent(params.previousTrackingId!.trim())}`);
  }

  let initialValues = {
    name: params.name || "",
    studentId: params.studentId || "",
    email: params.email || "",
    phone: params.phone || "",
    docName: params.docName || "",
    agencyType: params.agencyType || "",
    agencyValue: params.agencyValue || "",
    previousTrackingId: params.previousTrackingId || "",
  };

  if (!isResubmit && session?.user?.email) {
    const profile = await getUserProfile(session.user.email);
    const history = profile ? null : await getLatestApplicantInfo(session.user.email);
    const info = profile || history;

    initialValues = {
      ...initialValues,
      name: info?.name || initialValues.name,
      studentId: info?.studentId || initialValues.studentId,
      email: session.user.email,
      phone: info?.phone || initialValues.phone,
    };
  }

  return (
    <SubmitFlow
      agencyOptions={agencyOptions}
      initialValues={initialValues}
      isLoggedIn={!!session?.user?.email}
    />
  );
}
