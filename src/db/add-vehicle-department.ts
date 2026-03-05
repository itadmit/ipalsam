/**
 * מוסיף מחלקת רכב לבסיס הראשון
 * מריץ: npx tsx src/db/add-vehicle-department.ts
 */
import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function addVehicleDepartment() {
  console.log("🔄 מוסיף מחלקת רכב...\n");

  const [base] = await db.select().from(schema.bases).limit(1);
  if (!base) {
    console.error("❌ לא נמצא בסיס. יש ליצור בסיס קודם.");
    process.exit(1);
  }

  const allDepts = await db.select().from(schema.departments).where(eq(schema.departments.baseId, base.id));
  const existing = allDepts.find((d) => d.departmentType === "vehicles");

  if (existing) {
    console.log("✓ מחלקת רכב כבר קיימת:", existing.name);
    process.exit(0);
  }

  const [dept] = await db
    .insert(schema.departments)
    .values({
      baseId: base.id,
      name: "רכב",
      description: "מאגר מידע על רכבים – ללא מנגנון השאלה",
      departmentType: "vehicles",
      allowImmediate: false,
      allowScheduled: false,
      showOpenRequestButton: false,
    })
    .returning();

  console.log("✅ נוצרה מחלקת רכב:", dept.name, "(id:", dept.id, ")");
  console.log("\nכדי שמפקד מחלקה יראה את תפריט רכב – הגדר את departmentId שלו למחלקה זו והגדר departmentType=vehicles.");
}

addVehicleDepartment().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
