import { auth } from "@/auth";
import { getAgencyOptions } from "@/lib/agencies";
import { getUserProfile } from "@/lib/profile";
import { getLatestApplicantInfo } from "@/lib/applicantHistory";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const agencyOptions = await getAgencyOptions();
  const params = await searchParams;
  const session = await auth();

  // ถ้ามาจากลิงก์ยื่นแก้ไข (มี previousTrackingId) ให้ query param ชนะเสมอ
  const isResubmit = !!params.previousTrackingId;

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
    // ลองหาจากโปรไฟล์ที่บันทึกไว้ก่อน ถ้ายังไม่มีค่อย fallback ไปดูจากการยื่นเอกสารครั้งล่าสุด
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
    <SubmitForm
      agencyOptions={agencyOptions}
      initialValues={initialValues}
      isLoggedIn={!!session?.user?.email}
    />
  );
}