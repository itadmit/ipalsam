import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { ReportCardActions, QuickExportButton } from "./report-actions";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const reportTypes = [
    {
      id: "inventory",
      title: "דוח מלאי",
      description: "סיכום מלאי לפי מחלקות וקטגוריות",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "loans",
      title: "דוח השאלות",
      description: "פירוט כל ההשאלות הפעילות",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "overdue",
      title: "דוח איחורים",
      description: "פריטים שלא הוחזרו בזמן",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
    },
    {
      id: "movements",
      title: "דוח תנועות",
      description: "היסטוריית תנועות מלאי",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "usage",
      title: "דוח שימוש",
      description: "סטטיסטיקות שימוש בציוד",
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      id: "period",
      title: "דוח תקופה",
      description: "סיכום פתיחה/סגירה של תקופה",
      icon: Calendar,
      color: "bg-slate-50 text-slate-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title="דוחות"
        description="הפקת דוחות וייצוא נתונים"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${report.color} flex items-center justify-center`}>
                  <report.icon className="w-5 h-5" />
                </div>
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">{report.description}</p>
              <ReportCardActions reportId={report.id} reportTitle={report.title} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Export Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>ייצוא מהיר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <QuickExportButton type="inventory" label="ייצוא מלאי מלא (CSV)" />
            <QuickExportButton type="users" label="ייצוא משתמשים (CSV)" />
            <QuickExportButton type="requests" label="ייצוא השאלות החודש (CSV)" />
            <QuickExportButton type="audit" label="ייצוא Audit Log (CSV)" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
