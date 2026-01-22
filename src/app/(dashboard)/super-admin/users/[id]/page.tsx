import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, Key, Shield } from "lucide-react";
import { getRoleLabel, formatPhone, formatDate } from "@/lib/utils";
import { EditUserForm } from "./edit-user-form";
import type { SessionUser } from "@/types";

async function getUser(id: string) {
  // TODO: Fetch from DB
  const users: Record<string, {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: "super_admin" | "hq_commander" | "dept_commander" | "soldier";
    departmentId: string | null;
    departmentName: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
  }> = {
    "1": {
      id: "1",
      phone: "0542284283",
      firstName: "יוגב",
      lastName: "אביטן",
      email: "itadmit@gmail.com",
      role: "super_admin",
      departmentId: null,
      departmentName: null,
      isActive: true,
      lastLogin: new Date("2026-01-22T08:30:00"),
      createdAt: new Date("2026-01-01"),
    },
  };
  return users[id] || null;
}

async function getDepartments() {
  return [
    { id: "1", name: "קשר" },
    { id: "2", name: "נשק" },
    { id: "3", name: "לוגיסטיקה" },
    { id: "4", name: "אפסנאות" },
    { id: "5", name: "רכב" },
    { id: "6", name: "שלישות" },
  ];
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  const departments = await getDepartments();
  const isSuperAdmin = session.user.role === "super_admin";

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin": return "destructive";
      case "hq_commander": return "warning";
      case "dept_commander": return "info";
      default: return "secondary";
    }
  };

  return (
    <div>
      <PageHeader
        title={`עריכת ${user.firstName} ${user.lastName}`}
        description={formatPhone(user.phone)}
        actions={
          <Link href="/dashboard/users">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי משתמש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditUserForm
                user={user}
                departments={departments}
                isSuperAdmin={isSuperAdmin}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                סטטוס
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">תפקיד</p>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">סטטוס</p>
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </div>
              {user.departmentName && (
                <div>
                  <p className="text-sm text-slate-500">מחלקה</p>
                  <p className="font-medium">{user.departmentName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">התחברות אחרונה</p>
                <p className="font-medium">
                  {user.lastLogin ? formatDate(user.lastLogin) : "מעולם לא"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">נוצר</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                אבטחה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                איפוס סיסמה
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  className={`w-full ${user.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                >
                  {user.isActive ? "השבת משתמש" : "הפעל משתמש"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

