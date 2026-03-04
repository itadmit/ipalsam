/**
 * סקריפט לבדיקת בקשות פתוחות משי כהן
 * הרצה: npx tsx scripts/check-open-requests-shai.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, desc, inArray, or, and, ilike } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🔍 מחפש משתמשים: שי כהן, סהר פנקר...\n");

  const users = await db
    .select()
    .from(schema.users)
    .where(
      or(
        and(
          ilike(schema.users.firstName, "%שי%"),
          ilike(schema.users.lastName, "%כהן%")
        ),
        and(
          ilike(schema.users.firstName, "%סהר%"),
          ilike(schema.users.lastName, "%פנקר%")
        )
      )
    )
    .limit(20);

  console.log("משתמשים שנמצאו:");
  users.forEach((u) => {
    console.log(`  - ${u.firstName} ${u.lastName} (${u.role}) | טלפון: ${u.phone} | מחלקה: ${u.departmentId || "-"}`);
  });

  const shaiCohen = users.find((u) => u.lastName?.includes("כהן"));
  if (!shaiCohen) {
    console.log("\n⚠️ שי כהן לא נמצא במערכת");
    return;
  }

  const handoverDepts = await db.query.handoverDepartments.findMany({
    where: eq(schema.handoverDepartments.userId, shaiCohen.id),
    columns: { departmentId: true },
    with: { department: { columns: { name: true } } },
  });
  const storeDeptIds = handoverDepts.length > 0
    ? handoverDepts.map((d) => d.departmentId).filter(Boolean) as string[]
    : shaiCohen.departmentId
      ? [shaiCohen.departmentId]
      : [];

  console.log(`\n📦 שי כהן – חנויות (handover): ${storeDeptIds.length > 0 ? storeDeptIds.join(", ") : "ללא"}`);

  if (storeDeptIds.length === 0) {
    console.log("\n⚠️ לשי כהן אין מחלקות חנות – אין בקשות להציג");
    return;
  }

  const openReqs = await db.query.openRequests.findMany({
    where: inArray(schema.openRequests.departmentId, storeDeptIds),
    orderBy: [desc(schema.openRequests.createdAt)],
    with: {
      requester: { columns: { firstName: true, lastName: true, phone: true } },
      department: { columns: { name: true } },
      items: true,
    },
  });

  console.log(`\n📋 בקשות פתוחות לשי כהן: ${openReqs.length}\n`);

  for (const req of openReqs) {
    const requesterName = req.requester
      ? `${req.requester.firstName} ${req.requester.lastName}`
      : req.requesterName || "אנונימי";
    const requesterPhone = req.requester?.phone || req.requesterPhone || "-";
    console.log(`בקשה ${req.id.slice(0, 8)}... | מבקש: ${requesterName} (${requesterPhone}) | מחלקה: ${req.department?.name}`);
    for (const item of req.items) {
      console.log(`   - ${item.itemName} x${item.quantity} | סטטוס: ${item.status}`);
    }
    console.log("");
  }
}

main().catch(console.error);
