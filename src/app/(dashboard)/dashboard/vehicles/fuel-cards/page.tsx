import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditCard, Plus } from "lucide-react";
import { db } from "@/db";
import { departments, fuelCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isVehicleDepartment } from "@/lib/vehicle-constants";

export default async function FuelCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = session.user.role === "dept_commander" && session.user.departmentId === dept;

  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, dept),
    columns: { id: true, name: true, departmentType: true },
  });

  if (!department || !isVehicleDepartment(department)) {
    redirect("/dashboard/vehicles");
  }

  const cards = await db.query.fuelCards.findMany({
    where: eq(fuelCards.departmentId, dept),
  });

  return (
    <div>
      <PageHeader
        title="כרטיסי דלק"
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/fuel-cards/new?dept=${dept}`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              כרטיס חדש
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          {cards.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="אין כרטיסי דלק"
              description="הוסף כרטיס דלק חדש"
              action={
                <Link href={`/dashboard/vehicles/fuel-cards/new?dept=${dept}`}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    כרטיס חדש
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <p className="font-semibold">מס׳ כרטיס: {c.cardNumber}</p>
                    <p className="text-sm text-slate-500">
                      יתרה: ₪{(c.balance / 100).toFixed(2)} • התחלתי: ₪{(c.initialAmount / 100).toFixed(2)}
                    </p>
                  </div>
                  <Link href={`/dashboard/vehicles/fuel-cards/${c.id}?dept=${dept}`}>
                    <Button variant="outline" size="sm">עריכה</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
