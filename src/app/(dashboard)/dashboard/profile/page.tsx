import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, departments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, Pencil } from "lucide-react";

const roleLabels: Record<string, string> = {
  dept_commander: "מפקד מחלקה",
  hq_commander: "מפקד מפקדה",
  super_admin: "מנהל מערכת",
  soldier: "חייל",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
    },
    with: {
      department: { columns: { name: true } },
    },
  });

  if (!user) redirect("/dashboard");

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "משתמש";
  const roleLabel = roleLabels[user.role || "soldier"] || "חייל";

  return (
    <div>
      <PageHeader
        title="הפרופיל שלי"
        description="הפרופיל שלך מוצג ללקוחות בחנות"
        actions={
          <Link href="/dashboard/profile/edit">
            <Button className="gap-2">
              <Pencil className="w-4 h-4" />
              עריכה
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        {/* כיסוי */}
        <div className="relative h-56 bg-slate-200">
          {user.coverUrl ? (
            <img
              src={user.coverUrl}
              alt="כיסוי"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="https://www.oref.org.il/media/3pcju2vy/%D7%A4%D7%99%D7%A7%D7%95%D7%93-%D7%94%D7%A2%D7%95%D7%A8%D7%A3-%D7%9C%D7%9E%D7%A2%D7%9F-%D7%90%D7%96%D7%A8%D7%97%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C.png"
              alt="כיסוי"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/25" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xl font-bold text-white drop-shadow-sm"
              style={{ fontFamily: "var(--font-smooch-sans), system-ui, sans-serif" }}
            >
              iPalsam
            </span>
          </div>
        </div>
        <CardContent className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* תמונה עגולה */}
            <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-slate-500" />
              )}
            </div>
            <div className="flex-1 pt-2">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              <p className="text-slate-600">
                {roleLabel}
                {user.department?.name && ` • ${user.department.name}`}
              </p>
              <a
                href={`tel:${user.phone || ""}`}
                className="mt-2 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                {user.phone || "-"}
              </a>
              {user.bio && (
                <p className="mt-3 text-slate-600 text-sm">{user.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
