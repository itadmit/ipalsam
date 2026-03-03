/**
 * עדכון בקשות פתוחות ישנות (public_store) עם handoverUserId
 * מגדיר את מפקד המחלקה הראשון כבעל החנות (הערכה – לא מדויק עבור מחלקות עם כמה מפקדים)
 * הרצה: npx tsx src/scripts/fix-open-requests-handover.ts
 */
import "dotenv/config";
import { db } from "../db";
import { openRequests, users } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function main() {
  const old = await db.query.openRequests.findMany({
    where: and(
      eq(openRequests.source, "public_store"),
      isNull(openRequests.handoverUserId)
    ),
    columns: { id: true, departmentId: true },
  });

  if (old.length === 0) {
    console.log("אין בקשות פתוחות ישנות לעדכון");
    return;
  }

  console.log(`מעדכן ${old.length} בקשות...`);

  for (const req of old) {
    const deptCommander = await db.query.users.findFirst({
      where: eq(users.departmentId, req.departmentId!),
      columns: { id: true },
    });
    if (deptCommander) {
      await db
        .update(openRequests)
        .set({ handoverUserId: deptCommander.id })
        .where(eq(openRequests.id, req.id));
      console.log(`  עדכון ${req.id} -> ${deptCommander.id}`);
    }
  }

  console.log("הושלם");
}

main().catch(console.error).finally(() => process.exit(0));
