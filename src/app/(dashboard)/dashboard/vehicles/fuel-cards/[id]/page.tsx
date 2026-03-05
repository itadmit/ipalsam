import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { departments, fuelCards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FuelCardEditForm } from "./fuel-card-edit-form";

export default async function FuelCardEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = (session.user.role === "dept_commander" || session.user.role === "soldier") && session.user.departmentId === dept;

  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const card = await db.query.fuelCards.findFirst({
    where: eq(fuelCards.id, id),
  });

  if (!card || card.departmentId !== dept) notFound();

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, dept),
    columns: { id: true, name: true },
  });

  if (!department) redirect("/dashboard/vehicles");

  return (
    <div>
      <PageHeader
        title={`עריכת כרטיס ${card.cardNumber}`}
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/fuel-cards?dept=${dept}`}>
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-md">
        <CardContent className="p-6">
          <FuelCardEditForm
            cardId={id}
            departmentId={dept}
            initialCardNumber={card.cardNumber}
            initialBalance={card.balance}
          />
        </CardContent>
      </Card>
    </div>
  );
}
