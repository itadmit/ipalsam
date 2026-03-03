import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { openRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function MyOpenRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const myOpenRequests = await db.query.openRequests.findMany({
    where: eq(openRequests.requesterId, session.user.id),
    orderBy: [desc(openRequests.createdAt)],
    with: {
      department: { columns: { name: true } },
      items: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="הבקשות שלי"
        description="בקשות ציוד ששלחת – מעקב סטטוס"
      />

      {myOpenRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            אין לך בקשות פתוחות
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myOpenRequests.map((req) => {
            const pendingCount = req.items.filter((i) => i.status === "pending").length;
            const approvedCount = req.items.filter((i) => i.status === "approved").length;
            const rejectedCount = req.items.filter((i) => i.status === "rejected").length;
            return (
              <Card key={req.id}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={req.source === "public_store" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {req.source === "public_store" ? (
                        <>
                          <Store className="w-3 h-3 ml-1" />
                          בקשה פתוחה
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 ml-1" />
                          בקשה פתוחה
                        </>
                      )}
                    </Badge>
                    <span className="text-slate-600 text-sm">
                      {req.department?.name} • {formatDateTime(req.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {pendingCount > 0 && (
                      <span className="text-amber-600">ממתין: {pendingCount}</span>
                    )}
                    {approvedCount > 0 && (
                      <span className={pendingCount > 0 ? "me-3" : ""}>
                        <span className="text-emerald-600">אושר: {approvedCount}</span>
                      </span>
                    )}
                    {rejectedCount > 0 && (
                      <span className={pendingCount > 0 || approvedCount > 0 ? "me-3" : ""}>
                        <span className="text-red-600">נדחה: {rejectedCount}</span>
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 text-sm text-slate-700 list-disc list-inside space-y-1">
                    {req.items.map((item) => (
                      <li key={item.id} className="py-0.5">
                        {item.itemName} x{item.quantity}
                        {item.status === "pending" && (
                          <span className="text-amber-600 text-xs me-1">(ממתין)</span>
                        )}
                        {item.status === "approved" && (
                          <>
                            <span className="text-emerald-600 text-xs me-1">(אושר)</span>
                            {item.approvalNotes?.trim() && (
                              <span className="text-slate-500 text-xs me-1">– {item.approvalNotes}</span>
                            )}
                          </>
                        )}
                        {item.status === "rejected" && (
                          <>
                            <span className="text-red-600 text-xs me-1">(נדחה)</span>
                            {item.rejectionReason?.trim() && (
                              <span className="text-red-600/80 text-xs me-1">– {item.rejectionReason}</span>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
