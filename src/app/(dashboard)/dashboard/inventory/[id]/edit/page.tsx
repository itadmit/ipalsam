import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { EditItemForm } from "./edit-item-form";

// TODO: Replace with actual DB fetch
async function getItemType(id: string) {
  const items: Record<string, {
    id: string;
    name: string;
    catalogNumber: string;
    categoryId: string;
    departmentId: string;
    type: "serial" | "quantity";
    description: string;
    notes: string;
    minimumAlert: number;
    requiresDoubleApproval: boolean;
    maxLoanDays: number | null;
  }> = {
    "1": {
      id: "1",
      name: "מכשיר קשר דגם X",
      catalogNumber: "K-2341",
      categoryId: "1",
      departmentId: "1",
      type: "serial",
      description: "מכשיר קשר נייד לשימוש צבאי",
      notes: "יש לטעון לפני שימוש",
      minimumAlert: 10,
      requiresDoubleApproval: false,
      maxLoanDays: 7,
    },
  };
  return items[id] || null;
}

async function getCategories() {
  return [
    { id: "1", name: "מכשירי קשר" },
    { id: "2", name: "אנטנות" },
    { id: "3", name: "אביזרי קשר" },
  ];
}

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const item = await getItemType(id);

  if (!item) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <div>
      <PageHeader
        title={`עריכת ${item.name}`}
        description={`מק״ט: ${item.catalogNumber}`}
        actions={
          <Link href={`/dashboard/inventory/${id}`}>
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לפריט
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <EditItemForm item={item} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}

