import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { NewDepartmentForm } from "./new-department-form";
import { db } from "@/db";
import { bases } from "@/db/schema";
import type { SessionUser } from "@/types";

export default async function NewDepartmentPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const basesList = await db.query.bases.findMany({
    columns: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="מחלקה חדשה"
        description="יצירת מחלקה חדשה בבסיס"
        actions={
          <Link href="/dashboard/departments">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewDepartmentForm bases={basesList} />
        </CardContent>
      </Card>
    </div>
  );
}
