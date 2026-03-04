import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, openRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Phone, User, Pencil, Store, FileText, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { QuickRequestCard } from "../quick-request-card";
import { OpenRequestCard } from "../open-request-card";

const roleLabels: Record<string, string> = {
  dept_commander: "מפקד מחלקה",
  hq_commander: "מפקד מפקדה",
  super_admin: "מנהל מערכת",
  soldier: "חייל",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
    },
    with: {
      department: { columns: { name: true } },
    },
  });

  if (!user) redirect("/dashboard");

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "משתמש";
  const roleLabel = roleLabels[user.role || "soldier"] || "חייל";

  const phoneDigits = (user.phone || "").replace(/\D/g, "").slice(-10);
  const hasValidPhone = phoneDigits.length >= 9;

  const myOpenRequests = await db.query.openRequests.findMany({
    where: eq(openRequests.requesterId, session.user.id),
    orderBy: [desc(openRequests.createdAt)],
    with: {
      department: { columns: { name: true } },
      items: true,
    },
  });

  return (
    <div className="min-h-[calc(100vh-6rem)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="max-w-lg mx-auto w-full px-4 pb-8">
        {/* כרטיס פרופיל – כמו הפרונט */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          {/* כיסוי */}
          <div
            className="relative h-48 sm:h-56 bg-slate-200 w-full overflow-hidden"
            style={
              user.coverUrl
                ? { backgroundImage: `url(${user.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { backgroundImage: "url(https://www.oref.org.il/media/3pcju2vy/%D7%A4%D7%99%D7%A7%D7%95%D7%93-%D7%94%D7%A2%D7%95%D7%A8%D7%A3-%D7%9C%D7%9E%D7%A2%D7%9F-%D7%90%D7%96%D7%A8%D7%97%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C.png)", backgroundSize: "cover", backgroundPosition: "center" }
            }
          >
            <div className="absolute inset-0 bg-black/25" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-xl font-bold text-white drop-shadow-sm"
                style={{ fontFamily: "var(--font-smooch-sans), system-ui, sans-serif" }}
              >
                iPalsam
              </span>
            </div>
          </div>
          <div className="px-4 pb-6 -mt-14 relative">
            {/* תמונה עגולה */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-lg overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-500" />
              )}
            </div>
            {/* שם, תפקיד ואייקונים */}
            <div className="mt-3 flex flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                <p className="text-slate-600 text-sm">
                  {roleLabel}
                  {user.department?.name && ` • ${user.department.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasValidPhone && (
                  <Link href={`/profile/${phoneDigits}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 h-9">
                      <ExternalLink className="w-4 h-4" />
                      צפייה
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/profile/edit">
                  <Button size="sm" className="gap-1.5 h-9">
                    <Pencil className="w-4 h-4" />
                    עריכה
                  </Button>
                </Link>
              </div>
            </div>
            <a
              href={`tel:${user.phone || ""}`}
              className="mt-2 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              <Phone className="w-4 h-4" />
              {user.phone || "-"}
            </a>
            {user.bio && (
              <p className="mt-3 text-slate-600 text-sm">{user.bio}</p>
            )}
          </div>
        </div>

        {/* סקשנים מתחת לפרופיל */}
        <div className="mt-6 space-y-4">
        <CollapsibleSection
          title="הבקשות שלי"
          defaultOpen={myOpenRequests.length > 0}
          badge={
            myOpenRequests.length > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {myOpenRequests.length}
              </Badge>
            ) : undefined
          }
        >
          <div className="p-4">
            <p className="text-sm text-slate-500 mb-4">בקשות ציוד ששלחת – מעקב סטטוס</p>
            {myOpenRequests.length === 0 ? (
              <p className="text-slate-500 text-center py-6">אין לך בקשות פתוחות</p>
            ) : (
              <div className="space-y-4">
                {myOpenRequests
                  .filter((req) => req.items.some((i) => i.status !== "deleted"))
                  .map((req) => {
                  const visibleItems = req.items.filter((i) => i.status !== "deleted");
                  const pendingCount = visibleItems.filter((i) => i.status === "pending").length;
                  const approvedCount = visibleItems.filter((i) => i.status === "approved").length;
                  const rejectedCount = visibleItems.filter((i) => i.status === "rejected").length;
                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">{req.department?.name}</span>
                          <Badge
                            variant={req.source === "public_store" ? "secondary" : "outline"}
                            className="text-xs font-normal shrink-0"
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
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{formatDateTime(req.createdAt)}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {pendingCount > 0 && (
                            <span className="text-amber-600 text-xs font-medium">ממתין: {pendingCount}</span>
                          )}
                          {approvedCount > 0 && (
                            <span className="text-emerald-600 text-xs font-medium">אושר: {approvedCount}</span>
                          )}
                          {rejectedCount > 0 && (
                            <span className="text-red-600 text-xs font-medium">נדחה: {rejectedCount}</span>
                          )}
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {visibleItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-4 py-3 bg-white"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-800 text-sm">
                                {item.quantity}× {item.itemName}
                              </span>
                              {item.status === "approved" && item.approvalNotes?.trim() && (
                                <p className="text-slate-500 text-xs mt-0.5">{item.approvalNotes}</p>
                              )}
                              {item.status === "rejected" && item.rejectionReason?.trim() && (
                                <p className="text-red-600/90 text-xs mt-0.5">{item.rejectionReason}</p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                                item.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : item.status === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.status === "pending" ? "ממתין" : item.status === "approved" ? "אושר" : "נדחה"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="חנות" defaultOpen={user.role === "dept_commander"}>
          <div className="p-4 pt-0">
            <Suspense fallback={<div className="h-32 rounded-xl bg-slate-100 animate-pulse" />}>
              <QuickRequestCard userId={session.user.id} />
            </Suspense>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="בקשה פתוחה" defaultOpen={false}>
          <div className="p-4 pt-0">
            <Suspense fallback={<div className="h-24 rounded-xl bg-slate-100 animate-pulse" />}>
              <OpenRequestCard userId={session.user.id} />
            </Suspense>
          </div>
        </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
