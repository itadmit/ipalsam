import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { openRequestItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Archive } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default async function OpenRequestsArchivePage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const deletedItems = await db.query.openRequestItems.findMany({
    where: eq(openRequestItems.status, "deleted"),
    orderBy: [desc(openRequestItems.deletedAt), desc(openRequestItems.createdAt)],
    with: {
      openRequest: {
        with: {
          requester: { columns: { firstName: true, lastName: true } },
          department: { columns: { name: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="ארכיון בקשות פתוחות"
        description="פריטים שנמחקו – יצאו ללקוח או הוסרו. לצורכי דוחות בלבד."
      />

      <Card>
        <CardContent className="p-0">
          {deletedItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Archive className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>אין פריטים בארכיון</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-right py-3 px-4 font-medium">תאריך מחיקה</th>
                    <th className="text-right py-3 px-4 font-medium">פריט</th>
                    <th className="text-right py-3 px-4 font-medium">כמות</th>
                    <th className="text-right py-3 px-4 font-medium">מבקש</th>
                    <th className="text-right py-3 px-4 font-medium">מחלקה</th>
                    <th className="text-right py-3 px-4 font-medium">סטטוס קודם</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedItems.map((item) => {
                    const req = item.openRequest;
                    const wasApproved = !!item.approvedAt;
                    return (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                        <td className="py-3 px-4 text-slate-600">
                          {item.deletedAt ? formatDateTime(item.deletedAt) : "-"}
                        </td>
                        <td className="py-3 px-4 font-medium">{item.itemName}</td>
                        <td className="py-3 px-4">{item.quantity}</td>
                        <td className="py-3 px-4">
                          {req?.requester
                            ? `${req.requester.firstName} ${req.requester.lastName}`
                            : req?.requesterName || req?.requesterPhone || "-"}
                        </td>
                        <td className="py-3 px-4">{req?.department?.name || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              wasApproved ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {wasApproved ? "אושר (יצא ללקוח)" : "נדחה (הוסר)"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
