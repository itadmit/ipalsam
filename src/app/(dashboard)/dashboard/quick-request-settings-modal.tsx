"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateHandoverSettings } from "@/actions/departments";
import { Settings } from "lucide-react";

interface QuickRequestSettingsModalProps {
  departmentId: string;
  autoApproveRequests: boolean;
  storeDepartmentIds: string[];
  departments: { id: string; name: string }[];
}

export function QuickRequestSettingsModal({
  departmentId,
  autoApproveRequests,
  storeDepartmentIds,
  departments,
}: QuickRequestSettingsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [autoApprove, setAutoApprove] = useState(autoApproveRequests);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(storeDepartmentIds);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOpen = () => {
    setAutoApprove(autoApproveRequests);
    setSelectedDepts(storeDepartmentIds);
    setSaved(false);
    setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const result = await updateHandoverSettings(departmentId, {
        autoApproveRequests: autoApprove,
        storeDepartmentIds: selectedDepts,
      });
      if (result.error) {
        alert(result.error);
      } else {
        setSaved(true);
        router.refresh();
        setTimeout(() => {
          setSaved(false);
          setOpen(false);
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleOpen}
      >
        <Settings className="w-4 h-4" />
        הגדרות
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              הגדרות השאלה מהירה
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoApprove" className="text-sm text-slate-700">
                אישור אוטומטי לבקשות מהחנות
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                מחלקות להצגה בחנות (פריטים מחפיפות)
              </p>
              <p className="text-xs text-slate-500 mb-2">
                סמן אילו מחלקות יוצגו בחנות שלך. אם ריק – רק המחלקה שלך.
              </p>
              <div className="flex flex-wrap gap-3">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(d.id)}
                      onChange={() => toggleDept(d.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} loading={loading}>
              {saved ? "נשמר!" : "שמור הגדרות"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
