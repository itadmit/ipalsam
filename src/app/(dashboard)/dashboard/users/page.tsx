import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
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
import { Plus, Users, Filter, Edit, MoreHorizontal } from "lucide-react";
import { getRoleLabel, formatPhone, formatDate } from "@/lib/utils";

interface SearchParams {
  q?: string;
  role?: string;
  department?: string;
  page?: string;
}

async function UsersTable({ searchParams }: { searchParams: SearchParams }) {
  // TODO: Fetch from database with filters
  const users = [
    {
      id: "1",
      firstName: "יוגב",
      lastName: "אביטן",
      phone: "0542284283",
      email: "itadmit@gmail.com",
      role: "super_admin" as const,
      department: null,
      isActive: true,
      lastLogin: new Date("2026-01-22T08:30:00"),
    },
    {
      id: "2",
      firstName: "ניסם",
      lastName: "חדד",
      phone: "0527320191",
      email: "nisam@example.com",
      role: "hq_commander" as const,
      department: null,
      isActive: true,
      lastLogin: new Date("2026-01-22T09:15:00"),
    },
    {
      id: "3",
      firstName: "ולרי",
      lastName: "כהן",
      phone: "0541234567",
      email: "valeri@example.com",
      role: "dept_commander" as const,
      department: "קשר",
      isActive: true,
      lastLogin: new Date("2026-01-21T16:45:00"),
    },
    {
      id: "4",
      firstName: "דני",
      lastName: "לוי",
      phone: "0529876543",
      email: "dani@example.com",
      role: "dept_commander" as const,
      department: "נשק",
      isActive: true,
      lastLogin: new Date("2026-01-22T07:00:00"),
    },
    {
      id: "5",
      firstName: "יוסי",
      lastName: "כהן",
      phone: "0501112233",
      email: null,
      role: "soldier" as const,
      department: "קשר",
      isActive: true,
      lastLogin: new Date("2026-01-20T14:30:00"),
    },
    {
      id: "6",
      firstName: "דנה",
      lastName: "לוי",
      phone: "0523334455",
      email: "dana@example.com",
      role: "soldier" as const,
      department: "לוגיסטיקה",
      isActive: true,
      lastLogin: new Date("2026-01-19T11:00:00"),
    },
    {
      id: "7",
      firstName: "משה",
      lastName: "ישראלי",
      phone: "0545556677",
      email: null,
      role: "soldier" as const,
      department: "נשק",
      isActive: false,
      lastLogin: null,
    },
  ];

  // Filter based on search
  let filteredUsers = users;
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    filteredUsers = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.phone.includes(query)
    );
  }

  if (searchParams.role) {
    filteredUsers = filteredUsers.filter(
      (user) => user.role === searchParams.role
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="לא נמצאו משתמשים"
        description="נסה לשנות את מילות החיפוש או הפילטרים"
        action={
          <Link href="/super-admin/users/new">
            <Button>
              <Plus className="w-4 h-4" />
              הוסף משתמש
            </Button>
          </Link>
        }
      />
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "hq_commander":
        return "warning";
      case "dept_commander":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>משתמש</TableHead>
            <TableHead>טלפון</TableHead>
            <TableHead>תפקיד</TableHead>
            <TableHead>מחלקה</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>התחברות אחרונה</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 font-medium">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.email && (
                      <p className="text-sm text-slate-500">{user.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-sm" dir="ltr">
                  {formatPhone(user.phone)}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>{user.department || "-"}</TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {user.lastLogin ? formatDate(user.lastLogin) : "מעולם לא"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Link href={`/super-admin/users/${user.id}`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
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

  // Only admins can view all users
  if (
    session.user.role !== "super_admin" &&
    session.user.role !== "hq_commander" &&
    session.user.role !== "dept_commander"
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const canCreate =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander";

  return (
    <div>
      <PageHeader
        title="משתמשים"
        description="ניהול משתמשי המערכת"
        actions={
          canCreate && (
            <Link href="/super-admin/users/new">
              <Button>
                <Plus className="w-4 h-4" />
                משתמש חדש
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
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              סינון
            </Button>
          </div>

          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            }
          >
            <UsersTable searchParams={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

