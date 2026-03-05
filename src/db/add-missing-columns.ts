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

  // 7. department_type ב-departments
  try {
    await sql`ALTER TABLE departments ADD COLUMN department_type text`;
    console.log("✅ departments.department_type");
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "42701") {
      console.log("✓ departments.department_type כבר קיים");
    } else {
      throw e;
    }
  }

  // 8. vehicles + vehicle_kilometerage_history
  await sql`
    CREATE TABLE IF NOT EXISTS vehicles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      vehicle_number text NOT NULL,
      vehicle_type text NOT NULL,
      vehicle_type_other text,
      fitness text NOT NULL,
      fitness_other text,
      kilometerage integer DEFAULT 0 NOT NULL,
      last_service_date timestamp,
      license_url text,
      fuel_code text,
      fuel_type text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS vehicle_kilometerage_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      previous_km integer NOT NULL,
      new_km integer NOT NULL,
      updated_by_id uuid NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ vehicles, vehicle_kilometerage_history");

  // 9. accident_reports
  await sql`
    CREATE TABLE IF NOT EXISTS accident_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      reporter_name text NOT NULL,
      reporter_phone text NOT NULL,
      reporter_email text,
      vehicle_number text NOT NULL,
      vehicle_classification text,
      description text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ accident_reports");

  // 10. vehicle_drivers + driver_licenses
  await sql`
    CREATE TABLE IF NOT EXISTS vehicle_drivers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      name text NOT NULL,
      phone text,
      email text,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS driver_licenses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      driver_id uuid NOT NULL REFERENCES vehicle_drivers(id) ON DELETE CASCADE,
      license_type text NOT NULL,
      details text,
      expires_at timestamp,
      document_url text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ vehicle_drivers, driver_licenses");

  // 11. fuel_cards
  await sql`
    CREATE TABLE IF NOT EXISTS fuel_cards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      card_number text NOT NULL,
      initial_amount integer DEFAULT 0 NOT NULL,
      balance integer DEFAULT 0 NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✅ fuel_cards");

  // 12. request_approval_listeners
  await sql`
    CREATE TABLE IF NOT EXISTS request_approval_listeners (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listener_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listen_to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      listen_to_department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
      receive_email boolean DEFAULT true NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      CONSTRAINT at_least_one_listen_to CHECK (listen_to_user_id IS NOT NULL OR listen_to_department_id IS NOT NULL)
    )
  `;
  console.log("✅ request_approval_listeners");

  console.log("\n✅ הסתיים");
}

addMissingColumns().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
