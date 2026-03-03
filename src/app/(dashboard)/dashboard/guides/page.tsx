import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  ClipboardList,
  ArrowLeftRight,
  User,
  Package,
  Store,
  CheckCircle,
  Download,
  Search,
} from "lucide-react";

export default function GuidesPage() {
  return (
    <div>
      <PageHeader
        title="מדריכים"
        description="הדרכה מלאה לכל הפעולות במערכת iPalsam"
      />

      <div className="space-y-8">
        {/* למפקדים וקולטים */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              למפקדים וקולטי בקשות
            </CardTitle>
            <p className="text-sm text-slate-500">
              הדרכה למפקדי מחלקה, מפקדי מפקדה ומי שמטפל בבקשות
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                אישור ודחיית השאלות
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/requests" className="text-emerald-600 hover:underline font-medium">השאלות</Link></li>
                <li>סנן לפי סטטוס &quot;ממתינות לאישור&quot; כדי לראות בקשות חדשות</li>
                <li>לחץ על בקשה לצפייה בפרטים</li>
                <li>לחץ &quot;אשר&quot; או &quot;דחה&quot; – ייפתח חלון אימות</li>
                <li>באישור: ניתן להוסיף הערה (תישלח במייל למבקש)</li>
                <li>בדחייה: חובה להזין סיבת דחייה</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                בקשות פתוחות (ציוד מהספק)
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                בקשות לציוד שאין במלאי – נשלחות מהדשבורד או מחנות ציבורית (פרופיל).
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/open-requests" className="text-emerald-600 hover:underline font-medium">בקשות פתוחות</Link></li>
                <li>תראה רק בקשות ששייכות למחלקה שלך (או לחנות שלך אם הגיעו מפרופיל)</li>
                <li>לכל פריט: לחץ &quot;אישור&quot; או &quot;דחייה&quot;</li>
                <li>ייפתח חלון אימות – אשר או דחה שוב</li>
                <li>המבקש יקבל התראה על כל פריט שאושר או נדחה</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                מסירה והחזרה
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/handover" className="text-emerald-600 hover:underline font-medium">מסירה/החזרה</Link></li>
                <li><strong>מסירה:</strong> בחר השאלה שאושרה, סרוק את החייל (או הזן) וחתום</li>
                <li><strong>החזרה:</strong> עבור ל<Link href="/dashboard/loans" className="text-emerald-600 hover:underline font-medium">השאלות פעילות</Link>, בחר את ההשאלה והחזר</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                ייצוא לאקסל
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/requests" className="text-emerald-600 hover:underline font-medium">השאלות</Link></li>
                <li>סנן ומיין לפי הצורך (סטטוס, תאריך, פריט)</li>
                <li>לחץ על &quot;ייצוא CSV&quot;</li>
                <li>הקובץ יורד וניתן לפתוח ב-Excel</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Store className="w-4 h-4" />
                חנות ציבורית (פרופיל)
              </h3>
              <p className="text-slate-600 text-sm mb-2">
                אם יש לך פרופיל חנות – חיילים יכולים לבקש ממך דרך הלינק/QR. הבקשות יופיעו רק אצלך ב&quot;בקשות פתוחות&quot;.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/profile" className="text-emerald-600 hover:underline font-medium">הפרופיל שלי</Link></li>
                <li>לחץ &quot;צפייה בפרופיל&quot; כדי לראות איך הלינק נראה</li>
                <li>שתף את הלינק או הורד QR</li>
              </ol>
            </section>
          </CardContent>
        </Card>

        {/* למבקשים */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              למבקשים – איך לבקש ולבדוק סטטוס
            </CardTitle>
            <p className="text-sm text-slate-500">
              הדרכה למי שמבקש ציוד ורוצה לראות מה קורה עם הבקשה
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                הגשת השאלה חדשה
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/requests" className="text-emerald-600 hover:underline font-medium">השאלות</Link> → לחץ &quot;השאלה חדשה&quot;</li>
                <li>בחר מחלקה ופריטים, הזן כמות</li>
                <li>בחר דחיפות: מיידי או מתוזמן (תאריך ושעה)</li>
                <li>הזן שם החייל המקבל וטלפון</li>
                <li>חתום חתימה דיגיטלית</li>
                <li>לחץ &quot;שלח השאלה&quot;</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                בדיקת סטטוס הבקשה
              </h3>
              <p className="text-slate-600 text-sm mb-2">
                יש שתי דרכים לראות את הבקשות שלך:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li><strong>השאלות:</strong> עבור ל<Link href="/dashboard/requests" className="text-emerald-600 hover:underline font-medium">השאלות</Link> – תראה את כל ההשאלות שלך</li>
                <li>סנן לפי סטטוס: ממתינות לאישור, טופלו, נדחו</li>
                <li>לחץ על בקשה לצפייה בפרטים מלאים</li>
                <li>סטטוסים: <span className="text-amber-600">הוגשה</span> → <span className="text-emerald-600">אושרה</span> → <span className="text-blue-600">נמסרה</span> → <span className="text-slate-600">הוחזרה</span></li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                בקשות פתוחות (ציוד מהספק)
              </h3>
              <p className="text-slate-600 text-sm mb-2">
                אם ביקשת ציוד שאין במלאי (בקשה פתוחה):
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>עבור ל<Link href="/dashboard/profile" className="text-emerald-600 hover:underline font-medium">הפרופיל שלי</Link></li>
                <li>גלול למטה ל&quot;בקשות פתוחות&quot;</li>
                <li>תראה כל בקשה עם סטטוס: ממתין, אושר, נדחה</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Store className="w-4 h-4" />
                בקשת ציוד מחנות (פרופיל מפקד)
              </h3>
              <p className="text-slate-600 text-sm mb-2">
                אם קיבלת לינק/QR לפרופיל של מפקד – אפשר לבקש ממנו ישירות:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
                <li>פתח את הלינק או סרוק QR</li>
                <li>בחר פריטים, הזן כמות והערות</li>
                <li>חתום חתימה דיגיטלית</li>
                <li>המפקד יקבל התראה ויוכל לאשר או לדחות כל פריט</li>
              </ol>
            </section>
          </CardContent>
        </Card>

        {/* טבלת סטטוסים */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              משמעות הסטטוסים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-2 px-3 font-medium">סטטוס</th>
                    <th className="text-right py-2 px-3 font-medium">משמעות</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">הוגשה</td>
                    <td className="py-2 px-3 text-slate-600">הבקשה ממתינה לאישור</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">אושרה</td>
                    <td className="py-2 px-3 text-slate-600">המפקד אישר – ניתן לאסוף</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">נדחתה</td>
                    <td className="py-2 px-3 text-slate-600">הבקשה נדחתה – תראה סיבת דחייה</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">נמסרה</td>
                    <td className="py-2 px-3 text-slate-600">הציוד נמסר לחייל</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">הוחזרה</td>
                    <td className="py-2 px-3 text-slate-600">הציוד הוחזר</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium">באיחור</td>
                    <td className="py-2 px-3 text-slate-600">ההחזרה עברה את התאריך המתוכנן</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* עזרה */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <BookOpen className="w-12 h-12 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium text-slate-900">צריך עזרה נוספת?</p>
                <p className="text-sm text-slate-600 mt-1">
                  פנה ל<Link href="/about" className="text-emerald-600 hover:underline font-medium">עמוד אודות</Link> ליצירת קשר.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
