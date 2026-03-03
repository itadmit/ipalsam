import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { openRequests, openRequestItems, handoverDepartments, departments } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { SessionUser } from "@/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "date_desc";
  const status = searchParams.get("status") || ""; // "" | "pending" | "processed"

  const userId = session.user.id;
  const role = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;
  const isSuperAdmin = role === "super_admin";

  let departmentIds: string[] = [];
  if (isSuperAdmin || role === "hq_commander") {
    const all = await db.query.departments.findMany({
      where: eq(departments.isActive, true),
      columns: { id: true },
    });
    departmentIds = all.map((d) => d.id);
  } else if (role === "dept_commander" && userDeptId) {
    departmentIds = [userDeptId];
  } else {
    const handover = await db.query.handoverDepartments.findMany({
      where: eq(handoverDepartments.userId, userId),
      columns: { departmentId: true },
    });
    departmentIds = handover.map((h) => h.departmentId);
  }

  if (departmentIds.length === 0) {
    return new Response("", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="open-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const allRequestsRaw = await db.query.openRequests.findMany({
    where: inArray(openRequests.departmentId, departmentIds),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      requester: { columns: { firstName: true, lastName: true } },
      department: { columns: { name: true } },
      items: true,
    },
  });

  const allRequests = allRequestsRaw.filter((r) => {
    if (r.source === "public_store") {
      if (r.handoverUserId) {
        return r.handoverUserId === userId || isSuperAdmin;
      }
      return false;
    }
    return true;
  });

  let filtered = allRequests;
  if (status === "pending") {
    filtered = allRequests.filter((r) => r.items.some((i) => i.status === "pending"));
  } else if (status === "processed") {
    filtered = allRequests.filter((r) =>
      r.items.every((i) => i.status === "approved" || i.status === "rejected")
    );
  }

  if (sort === "date_asc") {
    filtered = [...filtered].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else if (sort === "date_desc") {
    filtered = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sort === "dept_asc") {
    filtered = [...filtered].sort((a, b) =>
      (a.department?.name || "").localeCompare(b.department?.name || "")
    );
  } else if (sort === "dept_desc") {
    filtered = [...filtered].sort((a, b) =>
      (b.department?.name || "").localeCompare(a.department?.name || "")
    );
  } else if (sort === "requester_asc") {
    filtered = [...filtered].sort((a, b) => {
      const nameA = a.requester
        ? `${a.requester.firstName} ${a.requester.lastName}`
        : a.requesterName || a.requesterPhone || "";
      const nameB = b.requester
        ? `${b.requester.firstName} ${b.requester.lastName}`
        : b.requesterName || b.requesterPhone || "";
      return nameA.localeCompare(nameB);
    });
  } else if (sort === "requester_desc") {
    filtered = [...filtered].sort((a, b) => {
      const nameA = a.requester
        ? `${a.requester.firstName} ${a.requester.lastName}`
        : a.requesterName || a.requesterPhone || "";
      const nameB = b.requester
        ? `${b.requester.firstName} ${b.requester.lastName}`
        : b.requesterName || b.requesterPhone || "";
      return nameB.localeCompare(nameA);
    });
  } else if (sort === "item_asc") {
    filtered = [...filtered].sort((a, b) => {
      const nameA = a.items[0]?.itemName || "";
      const nameB = b.items[0]?.itemName || "";
      return nameA.localeCompare(nameB);
    });
  } else if (sort === "item_desc") {
    filtered = [...filtered].sort((a, b) => {
      const nameA = a.items[0]?.itemName || "";
      const nameB = b.items[0]?.itemName || "";
      return nameB.localeCompare(nameA);
    });
  }

  const statusLabels: Record<string, string> = {
    pending: "ממתין",
    approved: "אושר",
    rejected: "נדחה",
  };

  const rows: string[][] = [];
  for (const req of filtered) {
    const requesterName = req.requester
      ? `${req.requester.firstName || ""} ${req.requester.lastName || ""}`.trim()
      : req.requesterName || req.requesterPhone || "חנות";
    const sourceLabel = "בקשה פתוחה";

    for (const item of req.items) {
      rows.push([
        req.createdAt.toISOString().slice(0, 16),
        requesterName,
        req.requesterPhone || "",
        req.department?.name || "",
        sourceLabel,
        item.itemName,
        String(item.quantity),
        item.notes || "",
        statusLabels[item.status] || item.status,
        item.rejectionReason || "",
      ]);
    }
  }

  const headers = [
    "תאריך",
    "מבקש",
    "טלפון",
    "מחלקה",
    "מקור",
    "פריט",
    "כמות",
    "הערות",
    "סטטוס",
    "סיבת דחייה",
  ];

  const escapeCsv = (v: string | number) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  return new Response(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="open-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
