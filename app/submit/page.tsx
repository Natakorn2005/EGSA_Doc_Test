import { auth } from "@/auth";
import { getAgencyOptions } from "@/lib/agencies";
import { getUserProfile } from "@/lib/profile";
import { getLatestApplicantInfo } from "@/lib/applicantHistory";
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
