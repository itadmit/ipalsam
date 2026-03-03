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

  // 3. visible_in_hq_dashboard ב-departments
  try {
    await sql`ALTER TABLE departments ADD COLUMN visible_in_hq_dashboard boolean DEFAULT true NOT NULL`;
    console.log("✅ departments.visible_in_hq_dashboard");
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "42701") {
      console.log("✓ departments.visible_in_hq_dashboard כבר קיים");
    } else {
      throw e;
    }
  }

  // 4. handover_departments
  await sql`
    CREATE TABLE IF NOT EXISTS handover_departments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ handover_departments");

  // 5. visible_features ב-users
  try {
    await sql`ALTER TABLE users ADD COLUMN visible_features jsonb`;
    console.log("✅ users.visible_features");
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "42701") {
      console.log("✓ users.visible_features כבר קיים");
    } else {
      throw e;
    }
  }

  // 6. soldier_departments (if not exists - CREATE TABLE handles it)
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
