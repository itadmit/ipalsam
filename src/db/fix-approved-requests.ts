/**
 * סקריפט לתיקון השאלות שנתקעו בסטטוס "אושר" - מעביר אותן ל"נמסר"
 * מריץ: npm run db:fix-approved
 */
import "dotenv/config";

import { db } from "./index";
import {
  requests,
  itemTypes,
  itemUnits,
  movements,
  signatures,
  auditLogs,
} from "./schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function fixApprovedRequests() {
  console.log("🔍 מחפש השאלות בסטטוס אושר...");

  const approvedReqs = await db.query.requests.findMany({
    where: eq(requests.status, "approved"),
    with: { itemType: true },
  });

  if (approvedReqs.length === 0) {
    console.log("✅ אין השאלות בסטטוס אושר שצריכות תיקון");
    return;
  }

  console.log(`📋 נמצאו ${approvedReqs.length} השאלות לעדכון`);

  for (const request of approvedReqs) {
    if (!request.itemType) {
      console.log(`⚠️ דילוג על ${request.id} - אין פריט`);
      continue;
    }

    let unitId = request.itemUnitId;

    // לפריטים סריאליים - שייך יחידה זמינה אם אין
    if (request.itemType.type === "serial" && !unitId) {
      const avail = await db.query.itemUnits.findFirst({
        where: and(
          eq(itemUnits.itemTypeId, request.itemTypeId),
          eq(itemUnits.status, "available")
        ),
      });
      if (avail) {
        unitId = avail.id;
        await db
          .update(requests)
          .set({ itemUnitId: unitId, updatedAt: new Date() })
          .where(eq(requests.id, request.id));
      } else {
        console.log(`⚠️ דילוג על ${request.id} - אין יחידה זמינה לפריט סריאלי`);
        continue;
      }
    }

    // פריט כמותי או סריאלי עם יחידה - הרץ מסירה
    if (request.itemType.type === "quantity" || unitId) {
      const executedBy = request.approvedById ?? request.requesterId;

      if (request.itemType.type === "quantity") {
        await db
          .update(itemTypes)
          .set({
            quantityAvailable: sql`${itemTypes.quantityAvailable} - ${request.quantity}`,
            quantityInUse: sql`${itemTypes.quantityInUse} + ${request.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(itemTypes.id, request.itemTypeId));
      } else if (unitId) {
        await db
          .update(itemUnits)
          .set({
            status: "in_use",
            currentHolderId: request.requesterId,
            updatedAt: new Date(),
          })
          .where(eq(itemUnits.id, unitId));
      }

      const [movement] = await db
        .insert(movements)
        .values({
          itemTypeId: request.itemTypeId,
          itemUnitId: unitId,
          requestId: request.id,
          type: "allocation",
          quantity: request.quantity,
          fromDepartmentId: request.departmentId,
          toUserId: request.requesterId,
          executedById: executedBy,
        })
        .returning();

      await db.insert(signatures).values({
        movementId: movement.id,
        requestId: request.id,
        userId: request.requesterId,
        signatureType: "handover",
        confirmed: true,
        pin: null,
      });

      await db
        .update(requests)
        .set({
          status: "handed_over",
          handedOverById: executedBy,
          handedOverAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(requests.id, request.id));

      await db.insert(auditLogs).values({
        userId: executedBy,
        action: "handover_item",
        entityType: "request",
        entityId: request.id,
        newValues: {},
      });

      console.log(`✅ ${request.id} → נמסר (${request.itemType.name})`);
    } else {
      console.log(`⚠️ דילוג על ${request.id} - פריט סריאלי ללא יחידה זמינה`);
    }
  }

  console.log("✅ הסתיים");
}

fixApprovedRequests().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
