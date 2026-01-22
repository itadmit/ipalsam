"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Filter, Download, X } from "lucide-react";

export function FilterButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const hasFilters = department || category || status;

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (department) params.set("department", department);
    else params.delete("department");
    
    if (category) params.set("category", category);
    else params.delete("category");
    
    if (status) params.set("status", status);
    else params.delete("status");

    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const handleClearFilters = () => {
    setDepartment("");
    setCategory("");
    setStatus("");
    router.push(pathname);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Filter className="w-4 h-4" />
        סינון
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>סינון מלאי</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
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
            <Select
              id="category"
              label="קטגוריה"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "ציוד קשר", label: "ציוד קשר" },
                { value: "נשק", label: "נשק" },
                { value: "מחשוב", label: "מחשוב" },
                { value: "אספקה", label: "אספקה" },
                { value: "ריהוט", label: "ריהוט" },
              ]}
              placeholder="כל הקטגוריות"
            />
            <Select
              id="status"
              label="זמינות"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "available", label: "זמין" },
                { value: "low", label: "מלאי נמוך" },
                { value: "out", label: "אזל" },
              ]}
              placeholder="כל הסטטוסים"
            />
          </div>
          <DialogFooter>
            {hasFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="w-4 h-4" />
                נקה
              </Button>
            )}
            <Button onClick={handleApplyFilters}>
              החל סינון
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // TODO: Call server action to generate export
      await new Promise((r) => setTimeout(r, 1500));
      
      // Simulate download
      const csvContent = "שם,מק״ט,כמות,זמין,בשימוש\nמכשיר קשר,K-2341,60,45,15\n";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} loading={loading}>
      <Download className="w-4 h-4" />
      {showSuccess ? "הורד!" : "ייצוא"}
    </Button>
  );
}

