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
import { Package, Plus, Minus, Trash2 } from "lucide-react";

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
            <label className="text-sm font-medium text-slate-700 block mb-2">פריטים</label>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="space-y-2">
                  <div className="flex justify-start -mb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="shrink-0 h-8 w-8 text-slate-400 hover:text-red-500 -ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      label="שם פריט"
                      placeholder="שם הפריט"
                      value={row.itemName}
                      onChange={(e) => updateRow(row.id, "itemName", e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">כמות</label>
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateRow(row.id, "quantity", Math.max(1, (row.quantity || 1) - 1))}
                          className="shrink-0 h-11 w-11 rounded-none text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity || ""}
                          onChange={(e) => updateRow(row.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 min-w-0 h-11 text-center text-base font-medium border-0 bg-transparent focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateRow(row.id, "quantity", (row.quantity || 1) + 1)}
                          className="shrink-0 h-11 w-11 rounded-none text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">הערות</label>
                      <textarea
                    placeholder="הערות"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="w-full gap-1.5 h-10 border-dashed border-2 text-slate-500 hover:text-slate-700 hover:border-slate-300 mt-2"
            >
              <Plus className="w-4 h-4" />
              הוסף פריט
            </Button>
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
