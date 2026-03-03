import { redirect } from "next/navigation";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  redirect(error ? `/about?error=${encodeURIComponent(error)}` : "/about");
}
