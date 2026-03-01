import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RequestEntryContent } from "../request-entry-content";

export default async function RequestByPhonePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneParam } = await params;
  const phoneDigits = phoneParam.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) {
    redirect("/request");
  }

  const allUsers = await db.query.users.findMany({
    where: eq(users.role, "dept_commander"),
    columns: { id: true, phone: true, departmentId: true },
  });

  const handoverUser = allUsers.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
  });

  if (!handoverUser || !handoverUser.departmentId) {
    redirect("/request");
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <RequestEntryContent fromPhone={phoneDigits} />
    </Suspense>
  );
}
