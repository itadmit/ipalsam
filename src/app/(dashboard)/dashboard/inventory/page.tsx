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
import { Plus, Package, Edit, Eye, FileSpreadsheet } from "lucide-react";
import { FilterButton, ExportButton } from "./inventory-actions";
import { SyncInventoryButton } from "./sync-inventory-button";
import { db } from "@/db";
import { itemTypes } from "@/db/schema";
import { like, or } from "drizzle-orm";

interface SearchParams {
  q?: string;
  category?: string;
  status?: string;
  department?: string;
  page?: string;
}

async function InventoryTable({ searchParams }: { searchParams: SearchParams }) {
  let items = await db.query.itemTypes.findMany({
    with: {
      department: true,
      category: true,
    },
    orderBy: (itemTypes, { desc }) => [desc(itemTypes.createdAt)],
  });

  // Filter based on search
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.catalogNumber && item.catalogNumber.toLowerCase().includes(query))
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="אין פריטים במלאי"
        description="התחל בהוספת פריטים למערכת"
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/new/bulk">
              <Button variant="outline">
                <FileSpreadsheet className="w-4 h-4" />
                קליטה בבאלק
              </Button>
            </Link>
            <Link href="/dashboard/inventory/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף פריט חדש
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>שם מוצר</TableHead>
            <TableHead>מק״ט</TableHead>
            <TableHead>קטגוריה</TableHead>
            <TableHead>מחלקה</TableHead>
            <TableHead>סוג</TableHead>
            <TableHead className="text-center">סה״כ</TableHead>
            <TableHead className="text-center">זמין</TableHead>
            <TableHead className="text-center">בשימוש</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const total = item.quantityTotal || 0;
            const available = item.quantityAvailable || 0;
            const inUse = item.quantityInUse || 0;
            const availablePercent = total > 0 ? Math.round((available / total) * 100) : 0;
            const isLow = availablePercent < 30;

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                    {item.catalogNumber || "-"}
                  </code>
                </TableCell>
                <TableCell>{item.category?.name || "-"}</TableCell>
                <TableCell>{item.department?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.type === "serial" ? "סריאלי" : "כמותי"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium">{total}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium ${isLow ? "text-red-600" : "text-green-600"}`}>
                    {available}
                  </span>
                </TableCell>
                <TableCell className="text-center text-blue-600 font-medium">{inUse}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/inventory/${item.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/inventory/${item.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="מלאי"
        description="ניהול כל הציוד במערכת"
        actions={
          <div className="flex gap-2">
            {(session.user.role === "super_admin" ||
              session.user.role === "hq_commander") && (
              <SyncInventoryButton />
            )}
            <ExportButton />
            <Link href="/dashboard/inventory/new/bulk">
              <Button variant="outline">
                <FileSpreadsheet className="w-4 h-4" />
                קליטה בבאלק
              </Button>
            </Link>
            <Link href="/dashboard/inventory/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף פריט
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי שם או מק״ט..."
              className="sm:w-80"
            />
            <FilterButton />
          </div>

          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            }
          >
            <InventoryTable searchParams={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
