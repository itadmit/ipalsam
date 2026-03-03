import { redirect } from "next/navigation";

export default async function RequestCheckoutRedirect({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  redirect(`/profile/${phone}/checkout`);
}
