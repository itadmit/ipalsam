import { redirect } from "next/navigation";

export default async function RequestPhonePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  redirect(`/profile/${phone}`);
}
