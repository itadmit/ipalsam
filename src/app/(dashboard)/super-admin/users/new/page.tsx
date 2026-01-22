import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { NewUserForm } from "./new-user-form";
import type { SessionUser } from "@/types";

async function getDepartments() {
  // TODO: Fetch from DB
  return [
    { id: "1", name: "קשר" },
    { id: "2", name: "נשק" },
    { id: "3", name: "לוגיסטיקה" },
    { id: "4", name: "אפסנאות" },
    { id: "5", name: "רכב" },
    { id: "6", name: "שלישות" },
  ];
}

export default async function NewUserPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const departments = await getDepartments();
  const isSuperAdmin = session.user.role === "super_admin";

  return (
    <div>
      <PageHeader
        title="משתמש חדש"
        description="יצירת משתמש חדש במערכת"
        actions={
          <Link href="/dashboard/users">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewUserForm departments={departments} isSuperAdmin={isSuperAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}

