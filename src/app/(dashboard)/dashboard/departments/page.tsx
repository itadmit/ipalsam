import { Suspense } from "react";
import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Building2, Settings, Eye } from "lucide-react";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import type { SessionUser } from "@/types";

async function DepartmentsList() {
  const depts = await db.query.departments.findMany({
    with: {
      users: true,
      itemTypes: true,
    },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });

  if (depts.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="אין מחלקות"
        description="התחל ביצירת מחלקות לבסיס"
        action={
          <Link href="/super-admin/departments/new">
            <Button>
              <Plus className="w-4 h-4" />
              הוסף מחלקה
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {depts.map((dept) => (
        <Card key={dept.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                  <p className="text-sm text-slate-500">{dept.description || "מחלקה"}</p>
                </div>
              </div>
              <Badge variant={dept.isActive ? "success" : "secondary"}>
                {dept.isActive ? "פעילה" : "לא פעילה"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {dept.users?.length || 0}
                </p>
                <p className="text-xs text-slate-500">משתמשים</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {dept.itemTypes?.length || 0}
                </p>
                <p className="text-xs text-slate-500">סוגי פריטים</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/dashboard/departments/${dept.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4" />
                  צפה
                </Button>
              </Link>
              <Link href={`/dashboard/departments/${dept.id}/settings`}>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canManage = canAccessSuperAdmin(session.user.role as SessionUser["role"]);

  return (
    <div>
      <PageHeader
        title="מחלקות"
        description="ניהול מחלקות הבסיס"
        actions={
          canManage && (
            <Link href="/super-admin/departments/new">
              <Button>
                <Plus className="w-4 h-4" />
                מחלקה חדשה
              </Button>
            </Link>
          )
        }
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        }
      >
        <DepartmentsList />
      </Suspense>
    </div>
  );
}
