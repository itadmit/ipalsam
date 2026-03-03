"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/ui/signature-pad";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOpenRequest } from "@/actions/open-requests";
import { Package, Plus, Trash2 } from "lucide-react";

interface OpenRequestFormProps {
  departments: { id: string; name: string }[];
  trigger: React.ReactNode;
}

interface ItemRow {
  id: string;
  itemName: string;
  quantity: number;
  notes: string;
}

function generateId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function OpenRequestForm({ departments, trigger }: OpenRequestFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [rows, setRows] = useState<ItemRow[]>([
    { id: generateId(), itemName: "", quantity: 1, notes: "" },
  ]);
  const [signature, setSignature] = useState<string | null>(null);

  const addRow = () => {
    setRows((prev) => [...prev, { id: generateId(), itemName: "", quantity: 1, notes: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof ItemRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = rows.filter(
      (r) => (r.itemName || "").trim().length > 0 && (r.quantity || 0) > 0
    );
    if (validItems.length === 0) {
      setError("יש להוסיף לפחות פריט אחד");
      return;
    }

    if (!departmentId) {
      setError("יש לבחור מחלקה");
      return;
    }

    if (!signature) {
      setError("יש לחתום חתימה דיגיטלית");
      return;
    }

    setLoading(true);
    try {
      const result = await createOpenRequest(
        departmentId,
        validItems.map((r) => ({
          itemName: r.itemName.trim(),
          quantity: r.quantity,
          notes: r.notes.trim() || undefined,
        })),
        { signature, source: "dashboard" }
      );

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setRows([{ id: generateId(), itemName: "", quantity: 1, notes: "" }]);
        setSignature(null);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            בקשה פתוחה
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-600">
          בקש ציוד מהספק – אין צורך במלאי. המבקש יקבל התראה ויוכל לאשר או לדחות כל פריט.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">מחלקה</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">פריטים</label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow} className="gap-1">
                <Plus className="w-4 h-4" />
                הוסף
              </Button>
            </div>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="שם הפריט"
                    value={row.itemName}
                    onChange={(e) => updateRow(row.id, "itemName", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="כמות"
                    value={row.quantity || ""}
                    onChange={(e) => updateRow(row.id, "quantity", parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Input
                    placeholder="הערות"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">חתימה</label>
            <SignaturePad value={signature} onChange={setSignature} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" loading={loading}>
              שלח בקשה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
