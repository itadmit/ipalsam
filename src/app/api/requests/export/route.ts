import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { SessionUser } from "@/types";
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") || "date_desc";
  const q = searchParams.get("q");

  let allRequests = await db.query.requests.findMany({
    with: { requester: true, itemType: true, department: true },
    orderBy: [desc(requests.createdAt)],
  });

  const user = session.user as SessionUser;
  if (user.role === "soldier") {
    allRequests = allRequests.filter((r) => r.requesterId === user.id);
  } else if (user.role === "dept_commander" && user.departmentId) {
    allRequests = allRequests.filter((r) => r.departmentId === user.departmentId);
  }

  if (q) {
    const query = q.toLowerCase();
    allRequests = allRequests.filter(
      (r) =>
        r.itemType?.name?.toLowerCase().includes(query) ||
        (r.recipientName || "").toLowerCase().includes(query) ||
        (r.recipientPhone || "").includes(query)
    );
  }

  if (status === "submitted") {
    allRequests = allRequests.filter((r) => r.status === "submitted");
  } else if (status === "processed") {
    allRequests = allRequests.filter((r) =>
      ["approved", "ready_for_pickup", "handed_over", "returned", "closed"].includes(r.status)
    );
  } else if (status === "rejected") {
    allRequests = allRequests.filter((r) => r.status === "rejected");
  }

  if (sort === "date_asc") {
    allRequests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else if (sort === "item_asc") {
    allRequests.sort((a, b) =>
      (a.itemType?.name || "").localeCompare(b.itemType?.name || "")
    );
  } else if (sort === "item_desc") {
    allRequests.sort((a, b) =>
      (b.itemType?.name || "").localeCompare(a.itemType?.name || "")
    );
  }

  const headers = [
    "תאריך",
    "מבקש",
    "טלפון",
    "פריט",
    "כמות",
    "מחלקה",
    "סטטוס",
    "דחיפות",
    "סיבת דחייה",
  ];

  const escapeCsv = (v: string | number) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const statusLabels: Record<string, string> = {
    draft: "טיוטה",
    submitted: "הוגשה",
    approved: "אושרה",
    rejected: "נדחתה",
    ready_for_pickup: "מוכנה לאיסוף",
    handed_over: "נמסרה",
    returned: "הוחזרה",
    closed: "נסגרה",
    overdue: "באיחור",
  };

  const rows = allRequests.map((r) => [
    r.createdAt.toISOString().slice(0, 16),
    r.recipientName ||
      (r.requester ? `${r.requester.firstName || ""} ${r.requester.lastName || ""}`.trim() : ""),
    r.recipientPhone || r.requester?.phone || "",
    r.itemType?.name || "",
    r.quantity,
    r.department?.name || "",
    statusLabels[r.status] || r.status,
    r.urgency === "immediate" ? "מיידי" : "מתוזמן",
    r.rejectionReason || "",
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  return new Response(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
