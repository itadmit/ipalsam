import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { IntakeForm } from "./intake-form";

async function getItemTypes() {
  // TODO: Fetch from DB based on user's department
  return [
    { id: "1", name: "מכשיר קשר דגם X", catalogNumber: "K-2341", type: "serial" as const },
    { id: "2", name: "אנטנה VHF", catalogNumber: "A-1122", type: "serial" as const },
    { id: "3", name: "אוזניות טקטיות", catalogNumber: "H-3300", type: "quantity" as const },
    { id: "4", name: "סוללות AA", catalogNumber: "B-5500", type: "quantity" as const },
  ];
}

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can intake
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const itemTypes = await getItemTypes();
  const preselectedItemId = params.item;

  return (
    <div>
      <PageHeader
        title="קליטת ציוד"
        description="הוספת יחידות למלאי קיים"
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה למלאי
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <IntakeForm itemTypes={itemTypes} preselectedItemId={preselectedItemId} />
        </CardContent>
      </Card>
    </div>
  );
}

