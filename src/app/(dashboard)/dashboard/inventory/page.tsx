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
import { Plus, Package, Filter, Download, Edit, Eye } from "lucide-react";

interface SearchParams {
  q?: string;
  category?: string;
  status?: string;
  page?: string;
}

async function InventoryTable({ searchParams }: { searchParams: SearchParams }) {
  // TODO: Fetch from database with filters
  const items = [
    {
      id: "1",
      name: "מכשיר קשר דגם X",
      catalogNumber: "K-2341",
      category: "ציוד קשר",
      department: "קשר",
      type: "serial",
      total: 60,
      available: 45,
      inUse: 15,
    },
    {
      id: "2",
      name: "אנטנה VHF",
      catalogNumber: "A-1122",
      category: "ציוד קשר",
      department: "קשר",
      type: "serial",
      total: 40,
      available: 32,
      inUse: 8,
    },
    {
      id: "3",
      name: "סוללות AA",
      catalogNumber: "B-5500",
      category: "אספקה",
      department: "אפסנאות",
      type: "quantity",
      total: 500,
      available: 420,
      inUse: 80,
    },
    {
      id: "4",
      name: "אוזניות טקטיות",
      catalogNumber: "H-3300",
      category: "ציוד קשר",
      department: "קשר",
      type: "serial",
      total: 25,
      available: 18,
      inUse: 7,
    },
    {
      id: "5",
      name: "מטען למכשיר קשר",
      catalogNumber: "C-4400",
      category: "ציוד קשר",
      department: "קשר",
      type: "quantity",
      total: 30,
      available: 28,
      inUse: 2,
    },
    {
      id: "6",
      name: 'רובה M16A1 5.56 מ"מ',
      catalogNumber: "W-1000",
      category: "נשק",
      department: "נשק",
      type: "serial",
      total: 100,
      available: 85,
      inUse: 15,
    },
    {
      id: "7",
      name: "מחשב נייד Dell Latitude",
      catalogNumber: "L-2000",
      category: "מחשוב",
      department: "לוגיסטיקה",
      type: "serial",
      total: 20,
      available: 15,
      inUse: 5,
    },
    {
      id: "8",
      name: "מיטת שדה",
      catalogNumber: "F-6000",
      category: "ריהוט",
      department: "שלישות",
      type: "quantity",
      total: 150,
      available: 120,
      inUse: 30,
    },
  ];

  // Filter based on search
  let filteredItems = items;
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    filteredItems = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.catalogNumber.toLowerCase().includes(query)
    );
  }

  if (filteredItems.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="לא נמצאו פריטים"
        description="נסה לשנות את מילות החיפוש או להוסיף פריטים חדשים"
        action={
          <Link href="/dashboard/inventory/new">
            <Button>
              <Plus className="w-4 h-4" />
              הוסף פריט חדש
            </Button>
          </Link>
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
          {filteredItems.map((item) => {
            const availablePercent = Math.round(
              (item.available / item.total) * 100
            );
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
                    {item.catalogNumber}
                  </code>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.department}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.type === "serial" ? "סריאלי" : "כמותי"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {item.total}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`font-medium ${isLow ? "text-red-600" : "text-green-600"}`}
                  >
                    {item.available}
                  </span>
                </TableCell>
                <TableCell className="text-center text-blue-600 font-medium">
                  {item.inUse}
                </TableCell>
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
            <Button variant="outline">
              <Download className="w-4 h-4" />
              ייצוא
            </Button>
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
            <InventoryTable searchParams={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

