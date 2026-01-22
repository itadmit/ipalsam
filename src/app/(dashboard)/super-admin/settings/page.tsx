import { auth, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Clock,
} from "lucide-react";
import type { SessionUser } from "@/types";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="הגדרות מערכת"
        description="הגדרות כלליות של המערכת"
      />

      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              הגדרות כלליות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="baseName"
              label="שם הבסיס"
              defaultValue="בסיס מרכזי"
            />
            <Input
              id="systemEmail"
              label="אימייל מערכת (לשליחת התראות)"
              type="email"
              defaultValue="system@ipalsam.co.il"
              dir="ltr"
            />
            <Button>שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              הגדרות התראות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">התראות איחור</p>
                <p className="text-sm text-slate-500">שלח התראה כשפריט באיחור</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">התראות מלאי נמוך</p>
                <p className="text-sm text-slate-500">שלח התראה כשמלאי יורד מתחת למינימום</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">התראות בקשות חדשות</p>
                <p className="text-sm text-slate-500">שלח התראה למפקד מחלקה על בקשה חדשה</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <Button>שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              אבטחה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="sessionTimeout"
              label="זמן פקיעת סשן (שעות)"
              type="number"
              defaultValue="24"
              min={1}
              max={72}
            />
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">חובת שינוי סיסמה</p>
                <p className="text-sm text-slate-500">משתמשים חדשים חייבים לשנות סיסמה</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <Button>שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Loan Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              הגדרות השאלה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="defaultLoanDays"
              label="ימי השאלה ברירת מחדל"
              type="number"
              defaultValue="7"
              min={1}
              max={365}
            />
            <Input
              id="overdueDays"
              label="ימים עד סימון כ'באיחור'"
              type="number"
              defaultValue="1"
              min={0}
              max={30}
            />
            <Button>שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              מסד נתונים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">מסד הנתונים מחובר ופעיל</p>
              <p className="text-sm text-green-600">Neon PostgreSQL</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">גיבוי ידני</Button>
              <Button variant="outline" className="text-red-600 hover:bg-red-50">
                ניקוי נתונים ישנים
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

