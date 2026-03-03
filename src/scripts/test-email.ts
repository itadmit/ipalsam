/**
 * סקריפט לבדיקת שליחת מייל
 * הרצה: npx tsx src/scripts/test-email.ts your@email.com
 */
import "dotenv/config";
import { sendEmail } from "../lib/email";
import { newRequestEmail } from "../lib/email-templates";

const to = process.argv[2] || process.env.SMTP_USER || "avitan.yogev@gmail.com";

async function main() {
  console.log("שולח מייל בדיקה ל:", to);
  const html = newRequestEmail({
    recipientName: "משתמש בדיקה",
    departmentName: "מחלקת לוגיסטיקה",
    items: [{ name: "פריט בדיקה", quantity: 1 }],
    recipientRole: "requester",
  });
  const ok = await sendEmail({
    to,
    subject: "בדיקת מייל – iPalsam",
    html,
  });
  console.log(ok ? "✓ המייל נשלח בהצלחה" : "✗ שגיאה – וודא ש-SMTP_PASS מוגדר ב-.env");
  process.exit(ok ? 0 : 1);
}

main();
