import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function reset() {
  console.log("🗑️  מאפס את מסד הנתונים...\n");

  // מחיקה לפי סדר התלויות (ילדים לפני הורים)
  const tables = [
    "signatures",
    "audit_logs",
    "system_settings",
    "inventory_snapshots",
    "movements",
    "requests",
    "item_units",
    "item_types",
    "categories",
    "operational_periods",
    "users",
    "departments",
    "bases",
  ];

  for (const table of tables) {
    await sql`TRUNCATE TABLE ${sql.unsafe(table)} CASCADE`;
    console.log(`   ✓ ${table}`);
  }

  console.log("\n✅ המסד אופס בהצלחה!\n");
}

reset()
  .catch((e) => {
    console.error("❌ שגיאה:", e);
    process.exit(1);
  });
