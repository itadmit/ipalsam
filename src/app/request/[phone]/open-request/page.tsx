import { redirect } from "next/navigation";

export default async function RequestOpenRequestRedirect({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  redirect(`/profile/${phone}/open-request`);
}
