import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function MyOpenRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // הבקשות שלי מוצגות כעת בפרופיל
  redirect("/dashboard/profile");
}
