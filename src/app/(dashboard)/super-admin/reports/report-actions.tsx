"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader2 } from "lucide-react";

interface ReportCardActionsProps {
  reportId: string;
  reportTitle: string;
}

export function ReportCardActions({ reportId, reportTitle }: ReportCardActionsProps) {
  const router = useRouter();
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("");

  const handleView = async () => {
    setLoading("view");
    try {
      // Build query params
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (department) params.set("department", department);
      
      // Navigate to report view page
      router.push(`/super-admin/reports/${reportId}?${params.toString()}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
      setShowViewDialog(false);
    }
  };

  const handleDownload = async () => {
    setLoading("download");
    try {
      // TODO: Call server action to generate report
      await new Promise((r) => setTimeout(r, 1500));
      
      // Simulate download
      const csvContent = `דוח ${reportTitle}\nתאריך הפקה: ${new Date().toLocaleDateString("he-IL")}\n\nשם,כמות,סטטוס\nפריט 1,10,תקין\n`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${reportId}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setShowViewDialog(true)}>
          <FileText className="w-4 h-4" />
          צפייה
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={loading === "download"}>
          {loading === "download" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הפקת {reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="dateFrom"
                label="מתאריך"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                id="dateTo"
                label="עד תאריך"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Select
              id="department"
              label="מחלקה"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={[
                { value: "קשר", label: "קשר" },
                { value: "נשק", label: "נשק" },
                { value: "לוגיסטיקה", label: "לוגיסטיקה" },
                { value: "אפסנאות", label: "אפסנאות" },
                { value: "רכב", label: "רכב" },
                { value: "שלישות", label: "שלישות" },
              ]}
              placeholder="כל המחלקות"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleView} loading={loading === "view"}>
              <FileText className="w-4 h-4" />
              הפק דוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface QuickExportButtonProps {
  type: "inventory" | "users" | "requests" | "audit";
  label: string;
}

export function QuickExportButton({ type, label }: QuickExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // TODO: Call server action to generate export based on type
      await new Promise((r) => setTimeout(r, 1500));
      
      // Simulate download
      let csvContent = "";
      switch (type) {
        case "inventory":
          csvContent = "שם,מק״ט,כמות,זמין,בשימוש\nמכשיר קשר,K-2341,60,45,15\n";
          break;
        case "users":
          csvContent = "שם פרטי,שם משפחה,טלפון,תפקיד,מחלקה\nיוגב,אביטן,0542284283,סופר אדמין,\n";
          break;
        case "requests":
          csvContent = "מבקש,פריט,כמות,סטטוס,תאריך\nיוסי כהן,מכשיר קשר,1,אושר,22/01/2026\n";
          break;
        case "audit":
          csvContent = "תאריך,משתמש,פעולה,פרטים\n22/01/2026 09:00,יוגב אביטן,התחברות,\n";
          break;
      }
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label}
    </Button>
  );
}

