/**
 * סנכרון מלאי - מחשב מחדש quantityInUse ו-quantityAvailable
 * לפי השאלות הפעילות (handed_over)
 * מריץ: npm run db:sync-inventory
 */
import "dotenv/config";

import { db } from "./index";
import { itemTypes, requests } from "./schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function syncInventory() {
  console.log("🔄 מסנכרן מלאי...\n");

  const quantityItems = await db.query.itemTypes.findMany({
    where: eq(itemTypes.type, "quantity"),
    columns: { id: true, name: true, quantityTotal: true, quantityAvailable: true, quantityInUse: true },
  });

  for (const item of quantityItems) {
    const total = item.quantityTotal || 0;

    const inUseResult = await db
      .select({ sum: sql<number>`COALESCE(SUM(${requests.quantity}), 0)` })
      .from(requests)
      .where(
        and(
          eq(requests.itemTypeId, item.id),
          eq(requests.status, "handed_over")
        )
      );

    const inUse = Number(inUseResult[0]?.sum ?? 0);
    const available = Math.max(0, total - inUse);

    const prevAvail = item.quantityAvailable ?? 0;
    const prevInUse = item.quantityInUse ?? 0;

    if (prevAvail !== available || prevInUse !== inUse) {
      await db
        .update(itemTypes)
        .set({
          quantityAvailable: available,
          quantityInUse: inUse,
          updatedAt: new Date(),
        })
        .where(eq(itemTypes.id, item.id));

      console.log(
        `✅ ${item.name}: זמין ${prevAvail}→${available}, בשימוש ${prevInUse}→${inUse}`
      );
    }
  }

  console.log("\n✅ הסתיים");
}

syncInventory().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
