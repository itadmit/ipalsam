import { redirect } from "next/navigation";

export default async function RequestPhoneRedirect({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  redirect(`/profile/${phone}`);
}
