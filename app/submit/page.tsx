import { getAgencyOptions } from "@/lib/agencies";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const agencyOptions = await getAgencyOptions();
  return <SubmitForm agencyOptions={agencyOptions} />;
}