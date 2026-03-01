/**
 * מוסיף עמודות וטבלאות שחסרות במסד הנתונים
 * מריץ: npx tsx src/db/add-missing-columns.ts
 */
import "dotenv/config";

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function addMissingColumns() {
  console.log("🔄 מוסיף עמודות חסרות...\n");

  // 1. barcode ב-users
  try {
    await sql`ALTER TABLE users ADD COLUMN barcode text`;
    await sql`ALTER TABLE users ADD CONSTRAINT users_barcode_unique UNIQUE (barcode)`;
    console.log("✅ users.barcode");
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "42701" || err?.code === "42P07") {
      console.log("✓ users.barcode כבר קיים");
    } else {
      throw e;
    }
  }

  // 2. auto_approve_requests ב-departments
  try {
    await sql`ALTER TABLE departments ADD COLUMN auto_approve_requests boolean DEFAULT false NOT NULL`;
    console.log("✅ departments.auto_approve_requests");
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "42701") {
      console.log("✓ departments.auto_approve_requests כבר קיים");
    } else {
      throw e;
    }
  }

  // 3. soldier_departments
  await sql`
    CREATE TABLE IF NOT EXISTS soldier_departments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ soldier_departments");

  console.log("\n✅ הסתיים");
}

addMissingColumns().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
