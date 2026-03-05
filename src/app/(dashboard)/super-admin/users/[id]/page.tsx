import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, Key, Shield } from "lucide-react";
import { QuickRequestCardForUser } from "./quick-request-card";
import { ResetPasswordButton } from "./reset-password-button";
import { ImpersonateButton } from "@/app/(dashboard)/dashboard/users/impersonate-button";
import { ApprovalListenersForm } from "./approval-listeners-form";
import { getRoleLabel, formatPhone, formatDate } from "@/lib/utils";
import { EditUserForm } from "./edit-user-form";
import { UserVisibleFeaturesForm } from "./user-visible-features-form";
import { db } from "@/db";
import { users, departments, soldierDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@/types";
import type { ExtendedVisibleFeatures } from "@/lib/visible-features";

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

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      department: true,
    },
  });

  if (!user) {
    notFound();
  }

  const soldierDepts = user.role === "soldier"
    ? await db.query.soldierDepartments.findMany({
        where: eq(soldierDepartments.userId, id),
        columns: { departmentId: true },
      })
    : [];

  const departmentsList = await db.query.departments.findMany({
    where: eq(departments.isActive, true),
    columns: { id: true, name: true },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });

  const usersList = await db.query.users.findMany({
    where: eq(users.isActive, true),
    columns: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: (users, { asc }) => [asc(users.firstName)],
  });

  const isSuperAdmin = session.user.role === "super_admin";

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const phoneDigits = (user.phone || "").replace(/\D/g, "").slice(-10);
  const personalLink = phoneDigits
    ? `${baseUrl}/profile/${phoneDigits}`
    : `${baseUrl}/profile`;
  const qrDataUrl = personalLink
    ? await QRCode.toDataURL(personalLink, { width: 160, margin: 1 })
    : null;

  const showQuickRequest =
    (user.role === "dept_commander" && user.departmentId) || user.role === "soldier";

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin": return "destructive";
      case "hq_commander": return "warning";
      case "dept_commander": return "info";
      default: return "secondary";
    }
  };

  const userData = {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as SessionUser["role"],
    departmentId: user.departmentId,
    departmentName: user.department?.name || null,
    barcode: user.barcode || "",
    soldierDepartmentIds: soldierDepts.map((d) => d.departmentId),
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
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
                user={userData}
                departments={departmentsList}
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
                  {getRoleLabel(user.role as SessionUser["role"])}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">סטטוס</p>
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </div>
              {user.department?.name && (
                <div>
                  <p className="text-sm text-slate-500">מחלקה</p>
                  <p className="font-medium">{user.department.name}</p>
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

          {showQuickRequest && (
            <QuickRequestCardForUser
              personalLink={personalLink}
              qrDataUrl={qrDataUrl}
              role={user.role === "dept_commander" ? "dept_commander" : "soldier"}
            />
          )}

          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  פיצ׳רים בתפריט
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  בחר אילו פיצ׳רים יוצגו למשתמש
                </p>
              </CardHeader>
              <CardContent>
                <UserVisibleFeaturesForm
                  userId={user.id}
                  userRole={user.role || "soldier"}
                  initialFeatures={(user.visibleFeatures as ExtendedVisibleFeatures | null) ?? null}
                />
              </CardContent>
            </Card>
          )}

          {(isSuperAdmin || session.user.role === "hq_commander") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  האזנה לאישורי בקשות
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  קבל מייל כשבקשות של חייל או מחלקה מאושרות
                </p>
              </CardHeader>
              <CardContent>
                <ApprovalListenersForm
                  userId={user.id}
                  userEmail={user.email}
                  usersList={usersList.map((u) => ({
                    id: u.id,
                    name: `${u.firstName} ${u.lastName}`.trim(),
                    phone: u.phone || "",
                  }))}
                  departmentsList={departmentsList.map((d) => ({ id: d.id, name: d.name }))}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                אבטחה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSuperAdmin && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">איפוס סיסמה – מאפס למספר הטלפון, המשתמש יצטרך להגדיר סיסמה חדשה</p>
                    <ResetPasswordButton userId={user.id} />
                  </div>
                  {user.id !== session.user.id && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">התחבר בתור – מתחבר כמשתמש זה (ללא שינוי סיסמה)</p>
                      <ImpersonateButton
                        userId={user.id}
                        userName={`${user.firstName} ${user.lastName}`}
                        compact={false}
                      />
                    </div>
                  )}
                </>
              )}
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
