import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SoldierRequestForm } from "./soldier-request-form";
import { getSoldierRequestData } from "@/actions/soldier-request";

export default async function SoldierRequestNewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; from?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const fromPhone = params.from;
  if (!token) {
    redirect("/request");
  }

  const data = await getSoldierRequestData(token, fromPhone);
  if ("error" in data) {
    redirect(`/request?error=${encodeURIComponent(data.error || "שגיאה")}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">השאלה חדשה</h1>
          <p className="text-slate-500 mt-1">
            שלום {data.soldier.name}, מלא את הפרטים וחתום
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-6">
            <SoldierRequestForm
              token={token}
              soldier={data.soldier}
              departments={data.departments}
              itemsByDepartment={data.itemsByDepartment}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
