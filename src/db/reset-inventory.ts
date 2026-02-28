import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function resetInventory() {
  console.log("🗑️  מאפס את המלאי...\n");

  // מחיקה לפי סדר התלויות - רק טבלאות מלאי
  const tables = [
    "signatures",
    "audit_logs",
    "inventory_snapshots",
    "movements",
    "requests",
    "item_units",
    "item_types",
    "categories",
  ];

  for (const table of tables) {
    await sql`TRUNCATE TABLE ${sql.unsafe(table)} CASCADE`;
    console.log(`   ✓ ${table}`);
  }

  console.log("\n✅ המלאי אופס בהצלחה!");
  console.log("   (משתמשים, מחלקות ובסיסים נשמרו)\n");
}

resetInventory()
  .catch((e) => {
    console.error("❌ שגיאה:", e);
    process.exit(1);
  });
