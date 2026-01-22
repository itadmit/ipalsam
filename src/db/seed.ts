import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Starting seed...");

  // Create base
  const [base] = await db
    .insert(schema.bases)
    .values({
      name: "בסיס מרכזי",
      status: "active",
      commanderName: "ניסם חדד",
      commanderPhone: "0527320191",
    })
    .returning();

  console.log("✅ Base created:", base.name);

  // Create departments
  const departmentsData = [
    { name: "קשר", description: "ציוד תקשורת ומכשירי קשר", operatingHoursStart: "08:00", operatingHoursEnd: "17:00" },
    { name: "נשק", description: "ניהול נשק ותחמושת", operatingHoursStart: "07:00", operatingHoursEnd: "19:00", allowImmediate: false },
    { name: "לוגיסטיקה", description: "ציוד מחשוב ותקשוב", operatingHoursStart: "08:00", operatingHoursEnd: "16:00" },
    { name: "אפסנאות", description: "אספקה כללית וחומרים מתכלים", operatingHoursStart: "08:00", operatingHoursEnd: "14:00" },
    { name: "רכב", description: "ניהול כלי רכב ותחזוקה", operatingHoursStart: "06:00", operatingHoursEnd: "22:00" },
    { name: "שלישות", description: "ציוד משרדי וריהוט", operatingHoursStart: "08:00", operatingHoursEnd: "17:00" },
  ];

  const departments = await db
    .insert(schema.departments)
    .values(
      departmentsData.map((d) => ({
        baseId: base.id,
        name: d.name,
        description: d.description,
        operatingHoursStart: d.operatingHoursStart,
        operatingHoursEnd: d.operatingHoursEnd,
        allowImmediate: d.allowImmediate !== false,
        allowScheduled: true,
      }))
    )
    .returning();

  console.log("✅ Departments created:", departments.length);

  // Get department IDs
  const kesherDept = departments.find((d) => d.name === "קשר")!;
  const neshekDept = departments.find((d) => d.name === "נשק")!;
  const logisticsDept = departments.find((d) => d.name === "לוגיסטיקה")!;
  const afsanautDept = departments.find((d) => d.name === "אפסנאות")!;

  // Create users
  const usersData = [
    {
      phone: "0542284283",
      firstName: "יוגב",
      lastName: "אביטן",
      email: "itadmit@gmail.com",
      role: "super_admin" as const,
      departmentId: null,
    },
    {
      phone: "0527320191",
      firstName: "ניסם",
      lastName: "חדד",
      email: "nisam@example.com",
      role: "hq_commander" as const,
      departmentId: null,
    },
    {
      phone: "0541234567",
      firstName: "ולרי",
      lastName: "כהן",
      email: "valeri@example.com",
      role: "dept_commander" as const,
      departmentId: kesherDept.id,
    },
    {
      phone: "0529876543",
      firstName: "דני",
      lastName: "לוי",
      email: "dani@example.com",
      role: "dept_commander" as const,
      departmentId: neshekDept.id,
    },
    {
      phone: "0501112233",
      firstName: "מיכל",
      lastName: "אברהם",
      email: "michal@example.com",
      role: "dept_commander" as const,
      departmentId: logisticsDept.id,
    },
    {
      phone: "0523334455",
      firstName: "יוסי",
      lastName: "מזרחי",
      email: null,
      role: "dept_commander" as const,
      departmentId: afsanautDept.id,
    },
    // Soldiers
    {
      phone: "0545556677",
      firstName: "יוסי",
      lastName: "כהן",
      email: null,
      role: "soldier" as const,
      departmentId: kesherDept.id,
    },
    {
      phone: "0507778899",
      firstName: "דנה",
      lastName: "לוי",
      email: "dana@example.com",
      role: "soldier" as const,
      departmentId: kesherDept.id,
    },
    {
      phone: "0509990011",
      firstName: "אבי",
      lastName: "מזרחי",
      email: null,
      role: "soldier" as const,
      departmentId: logisticsDept.id,
    },
  ];

  for (const userData of usersData) {
    const hashedPassword = await hash(userData.phone, 12);
    await db.insert(schema.users).values({
      phone: userData.phone,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      departmentId: userData.departmentId,
      baseId: base.id,
      mustChangePassword: userData.role === "soldier", // Only soldiers need to change password
    });
  }

  console.log("✅ Users created:", usersData.length);

  // Create categories
  const categoriesData = [
    { departmentId: kesherDept.id, name: "מכשירי קשר" },
    { departmentId: kesherDept.id, name: "אנטנות" },
    { departmentId: kesherDept.id, name: "אביזרי קשר" },
    { departmentId: neshekDept.id, name: "נשק קל" },
    { departmentId: neshekDept.id, name: "תחמושת" },
    { departmentId: logisticsDept.id, name: "מחשוב" },
    { departmentId: logisticsDept.id, name: "ציוד משרדי" },
    { departmentId: afsanautDept.id, name: "סוללות ומצברים" },
    { departmentId: afsanautDept.id, name: "חומרי ניקיון" },
  ];

  const categories = await db
    .insert(schema.categories)
    .values(categoriesData)
    .returning();

  console.log("✅ Categories created:", categories.length);

  // Create item types
  const kesherCategory = categories.find((c) => c.name === "מכשירי קשר")!;
  const antenotCategory = categories.find((c) => c.name === "אנטנות")!;
  const abizereyCategory = categories.find((c) => c.name === "אביזרי קשר")!;
  const neshekCategory = categories.find((c) => c.name === "נשק קל")!;
  const machshuvCategory = categories.find((c) => c.name === "מחשוב")!;
  const solalotCategory = categories.find((c) => c.name === "סוללות ומצברים")!;

  const itemTypesData = [
    // קשר - סריאלי
    {
      departmentId: kesherDept.id,
      categoryId: kesherCategory.id,
      name: "מכשיר קשר דגם X",
      catalogNumber: "K-2341",
      type: "serial" as const,
    },
    {
      departmentId: kesherDept.id,
      categoryId: antenotCategory.id,
      name: "אנטנה VHF",
      catalogNumber: "A-1122",
      type: "serial" as const,
    },
    // קשר - כמותי
    {
      departmentId: kesherDept.id,
      categoryId: abizereyCategory.id,
      name: "אוזניות טקטיות",
      catalogNumber: "H-3300",
      type: "quantity" as const,
      quantityTotal: 25,
      quantityAvailable: 18,
      quantityInUse: 7,
    },
    {
      departmentId: kesherDept.id,
      categoryId: abizereyCategory.id,
      name: "מטען למכשיר קשר",
      catalogNumber: "C-4400",
      type: "quantity" as const,
      quantityTotal: 30,
      quantityAvailable: 28,
      quantityInUse: 2,
    },
    // נשק - סריאלי
    {
      departmentId: neshekDept.id,
      categoryId: neshekCategory.id,
      name: 'רובה M16A1 5.56 מ"מ',
      catalogNumber: "W-1000",
      type: "serial" as const,
      requiresDoubleApproval: true,
    },
    // לוגיסטיקה - סריאלי
    {
      departmentId: logisticsDept.id,
      categoryId: machshuvCategory.id,
      name: "מחשב נייד Dell Latitude",
      catalogNumber: "L-2000",
      type: "serial" as const,
      maxLoanDays: 14,
    },
    // אפסנאות - כמותי
    {
      departmentId: afsanautDept.id,
      categoryId: solalotCategory.id,
      name: "סוללות AA",
      catalogNumber: "B-5500",
      type: "quantity" as const,
      quantityTotal: 500,
      quantityAvailable: 420,
      quantityInUse: 80,
      minimumAlert: 50,
    },
    {
      departmentId: afsanautDept.id,
      categoryId: solalotCategory.id,
      name: "סוללות 9V",
      catalogNumber: "B-5501",
      type: "quantity" as const,
      quantityTotal: 100,
      quantityAvailable: 85,
      quantityInUse: 15,
      minimumAlert: 20,
    },
  ];

  const insertedItemTypes = await db
    .insert(schema.itemTypes)
    .values(
      itemTypesData.map((item) => ({
        ...item,
        quantityTotal: item.quantityTotal ?? null,
        quantityAvailable: item.quantityAvailable ?? null,
        quantityInUse: item.quantityInUse ?? 0,
        minimumAlert: item.minimumAlert ?? 0,
        requiresDoubleApproval: item.requiresDoubleApproval ?? false,
        maxLoanDays: item.maxLoanDays ?? null,
      }))
    )
    .returning();

  console.log("✅ Item types created:", insertedItemTypes.length);

  // Create serial units for some items
  const kesherMachshir = insertedItemTypes.find((i) => i.catalogNumber === "K-2341")!;
  const antenna = insertedItemTypes.find((i) => i.catalogNumber === "A-1122")!;
  const rifle = insertedItemTypes.find((i) => i.catalogNumber === "W-1000")!;
  const laptop = insertedItemTypes.find((i) => i.catalogNumber === "L-2000")!;

  // Add serial units
  const serialUnitsData = [
    // מכשירי קשר
    ...Array.from({ length: 60 }, (_, i) => ({
      itemTypeId: kesherMachshir.id,
      serialNumber: `K-2341-${String(i + 1).padStart(3, "0")}`,
      status: i < 45 ? ("available" as const) : ("in_use" as const),
    })),
    // אנטנות
    ...Array.from({ length: 40 }, (_, i) => ({
      itemTypeId: antenna.id,
      serialNumber: `A-1122-${String(i + 1).padStart(3, "0")}`,
      status: i < 32 ? ("available" as const) : ("in_use" as const),
    })),
    // רובים
    ...Array.from({ length: 100 }, (_, i) => ({
      itemTypeId: rifle.id,
      serialNumber: `W-1000-${String(i + 1).padStart(3, "0")}`,
      status: i < 85 ? ("available" as const) : ("in_use" as const),
    })),
    // מחשבים
    ...Array.from({ length: 20 }, (_, i) => ({
      itemTypeId: laptop.id,
      serialNumber: `L-2000-${String(i + 1).padStart(3, "0")}`,
      status: i < 15 ? ("available" as const) : ("in_use" as const),
    })),
  ];

  await db.insert(schema.itemUnits).values(serialUnitsData);

  console.log("✅ Serial units created:", serialUnitsData.length);

  console.log("🎉 Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });

