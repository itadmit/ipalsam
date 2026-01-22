import { Suspense } from "react";
import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBar } from "@/components/layout/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Users, Edit } from "lucide-react";
import { getRoleLabel, formatPhone } from "@/lib/utils";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { SessionUser } from "@/types";

interface SearchParams {
  q?: string;
  role?: string;
}

async function UsersTable({ searchParams, currentUser }: { searchParams: SearchParams; currentUser: SessionUser }) {
  let allUsers = await db.query.users.findMany({
    with: {
      department: true,
    },
    orderBy: (users, { asc }) => [asc(users.firstName)],
  });

  // Filter for dept commanders - only their department
  if (currentUser.role === "dept_commander" && currentUser.departmentId) {
    allUsers = allUsers.filter((u) => u.departmentId === currentUser.departmentId);
  }

  // Filter by search
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    allUsers = allUsers.filter(
      (u) =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.phone.includes(query)
    );
  }

  // Filter by role
  if (searchParams.role) {
    allUsers = allUsers.filter((u) => u.role === searchParams.role);
  }

  if (allUsers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="אין משתמשים"
        description="התחל בהוספת משתמשים למערכת"
        action={
          canAccessSuperAdmin(currentUser.role) && (
            <Link href="/super-admin/users/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף משתמש
              </Button>
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>שם</TableHead>
            <TableHead>טלפון</TableHead>
            <TableHead>אימייל</TableHead>
            <TableHead>תפקיד</TableHead>
            <TableHead>מחלקה</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 font-medium">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </div>
              </TableCell>
              <TableCell dir="ltr" className="text-left">{formatPhone(user.phone)}</TableCell>
              <TableCell>{user.email || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {getRoleLabel(user.role as SessionUser["role"])}
                </Badge>
              </TableCell>
              <TableCell>{user.department?.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/super-admin/users/${user.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can see users
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const canManage = canAccessSuperAdmin(session.user.role as SessionUser["role"]);

  return (
    <div>
      <PageHeader
        title="משתמשים"
        description="ניהול משתמשי המערכת"
        actions={
          canManage && (
            <Link href="/super-admin/users/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף משתמש
              </Button>
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי שם או טלפון..."
              className="sm:w-80"
            />
          </div>

          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            }
          >
            <UsersTable searchParams={params} currentUser={session.user as SessionUser} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
