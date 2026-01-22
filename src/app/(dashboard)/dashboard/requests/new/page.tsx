import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // TODO: Fetch departments and items from database
  const departments = [
    { id: "1", name: "קשר" },
    { id: "2", name: "נשק" },
    { id: "3", name: "לוגיסטיקה" },
    { id: "4", name: "אפסנאות" },
    { id: "5", name: "רכב" },
    { id: "6", name: "שלישות" },
  ];

  const itemsByDepartment: Record<
    string,
    { id: string; name: string; available: number }[]
  > = {
    "1": [
      { id: "1", name: "מכשיר קשר דגם X", available: 45 },
      { id: "2", name: "אנטנה VHF", available: 32 },
      { id: "3", name: "אוזניות טקטיות", available: 18 },
      { id: "4", name: "מטען למכשיר קשר", available: 28 },
    ],
    "2": [
      { id: "5", name: 'רובה M16A1 5.56 מ"מ', available: 85 },
    ],
    "3": [
      { id: "6", name: "מחשב נייד Dell Latitude", available: 15 },
    ],
    "4": [
      { id: "7", name: "סוללות AA", available: 420 },
      { id: "8", name: "סוללות 9V", available: 85 },
    ],
    "5": [],
    "6": [],
  };

  return (
    <div>
      <PageHeader title="בקשה חדשה" description="הגשת בקשה להשאלת ציוד" />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewRequestForm
            departments={departments}
            itemsByDepartment={itemsByDepartment}
          />
        </CardContent>
      </Card>
    </div>
  );
}

