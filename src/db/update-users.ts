import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const DEPARTMENTS_NEEDED = [
  "מחשוב",
  "קשר",
  "רכב",
  "שלישות",
  "מטבח",
  "חימוש",
];

const USERS_DATA = [
  {
    phone: "0542284283",
    firstName: "יוגב",
    lastName: "אביטן",
    role: "super_admin" as const,
    department: "מחשוב",
  },
  {
    phone: "0527320191",
    firstName: "ניסים",
    lastName: "חדד",
    role: "hq_commander" as const,
    department: null,
  },
  {
    phone: "0548014650",
    firstName: "ולרי",
    lastName: "שניידר",
    role: "dept_commander" as const,
    department: "קשר",
  },
  {
    phone: "0505381000",
    firstName: "ירמי",
    lastName: "מזרחי",
    role: "dept_commander" as const,
    department: "רכב",
  },
  {
    phone: "0546543498",
    firstName: "מיכל",
    lastName: "הרשקוביץ",
    role: "hq_commander" as const,
    department: null,
  },
  {
    phone: "0528765594",
    firstName: "נוען",
    lastName: "מלול",
    role: "dept_commander" as const,
    department: "שלישות",
  },
  {
    phone: "0543218124",
    firstName: "נועה",
    lastName: "גריבי",
    role: "dept_commander" as const,
    department: "שלישות",
  },
  {
    phone: "0506780152",
    firstName: "דוד",
    lastName: "עמיאל",
    role: "dept_commander" as const,
    department: "מטבח",
  },
  {
    phone: "0526632544",
    firstName: "דן",
    lastName: "קהני",
    role: "dept_commander" as const,
    department: "חימוש",
  },
];

async function updateUsers() {
  console.log("🔄 מעדכן משתמשים ומחלקות...\n");

  // קבלת או יצירת בסיס
  let [base] = await db.select().from(schema.bases).limit(1);
  if (!base) {
    [base] = await db
      .insert(schema.bases)
      .values({
        name: "בסיס מרכזי",
        status: "active",
      })
      .returning();
    console.log("✅ בסיס נוצר:", base.name);
  } else {
    console.log("✓ בסיס קיים:", base.name);
  }

  // קבלת מחלקות קיימות
  const existingDepts = await db
    .select()
    .from(schema.departments)
    .where(eq(schema.departments.baseId, base.id));

  const deptMap: Record<string, string> = {};
  for (const d of existingDepts) {
    deptMap[d.name] = d.id;
  }

  // יצירת מחלקות חסרות
  for (const name of DEPARTMENTS_NEEDED) {
    if (!deptMap[name]) {
      const [newDept] = await db
        .insert(schema.departments)
        .values({
          baseId: base.id,
          name,
          description: `מחלקת ${name}`,
          operatingHoursStart: "08:00",
          operatingHoursEnd: "17:00",
        })
        .returning();
      deptMap[name] = newDept.id;
      console.log("✅ מחלקה נוצרה:", name);
    }
  }
  console.log("✓ מחלקות:", Object.keys(deptMap).join(", "));

  // מחיקת כל המשתמשים
  await db.delete(schema.users);
  console.log("\n🗑️  כל המשתמשים נמחקו");

  // יצירת המשתמשים החדשים
  for (const u of USERS_DATA) {
    const hashedPassword = await hash(u.phone, 12);
    await db.insert(schema.users).values({
      phone: u.phone,
      password: hashedPassword,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      departmentId: u.department ? deptMap[u.department] : null,
      baseId: base.id,
      mustChangePassword: false,
    });
    console.log(`   ✓ ${u.firstName} ${u.lastName} (${u.phone}) - ${u.role}${u.department ? ` - ${u.department}` : ""}`);
  }

  console.log("\n✅ עודכן בהצלחה! סה\"כ", USERS_DATA.length, "משתמשים\n");
}

updateUsers()
  .catch((e) => {
    console.error("❌ שגיאה:", e);
    process.exit(1);
  });
