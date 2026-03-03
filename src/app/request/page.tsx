import { redirect } from "next/navigation";

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  redirect(error ? `/profile?error=${encodeURIComponent(error)}` : "/profile");
}
