import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Redirect to group return page (handles both single and grouped)
  redirect(`/dashboard/handover/group/${id}/return`);
}
