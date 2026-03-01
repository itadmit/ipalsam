"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/ui/signature-pad";
import { createRequestBySoldier } from "@/actions/soldier-request";
import { Package, User, Plus, Trash2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  inStock: boolean;
}

interface SoldierRequestFormProps {
  token: string;
  soldier: { id: string; name: string; phone: string };
  departments: Department[];
  itemsByDepartment: Record<string, Item[]>;
}

interface RequestRow {
  id: string;
  departmentId: string;
  itemTypeId: string;
  quantity: number;
}

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function SoldierRequestForm({
  token,
  soldier,
  departments,
  itemsByDepartment,
}: SoldierRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [recipientName, setRecipientName] = useState(soldier.name);
  const [recipientPhone, setRecipientPhone] = useState(soldier.phone);
  const [notes, setNotes] = useState("");
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);

  const [rows, setRows] = useState<RequestRow[]>([
    { id: generateRowId(), departmentId: "", itemTypeId: "", quantity: 1 },
  ]);

  const allItems = useMemo(() => {
    return Object.entries(itemsByDepartment).flatMap(([deptId, items]) =>
      items.map((i) => ({ ...i, departmentId: deptId }))
    );
  }, [itemsByDepartment]);

  const getItemLabel = (item: Item & { departmentId?: string }, excludeRowId?: string) => {
    const requestedInForm = rows
      .filter((r) => r.itemTypeId === item.id && r.id !== excludeRowId)
      .reduce((sum, r) => sum + r.quantity, 0);
    const inStock = item.inStock;
    const wouldExceed = requestedInForm >= 1 && !inStock;
    const suffix = !inStock ? " — אזל המלאי" : "";
    return `${item.name}${suffix}`;
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: generateRowId(), departmentId: "", itemTypeId: "", quantity: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof RequestRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [field]: value };
        if (field === "departmentId") next.itemTypeId = "";
        return next;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validRows = rows.filter((r) => r.departmentId && r.itemTypeId && r.quantity > 0);
    if (validRows.length === 0) {
      setError("יש להוסיף לפחות פריט אחד");
      return;
    }

    for (const row of validRows) {
      const item = allItems.find((i) => i.id === row.itemTypeId);
      if (item && !item.inStock) {
        setError(`אזל המלאי עבור "${item.name}"`);
        return;
      }
    }

    if (!recipientName.trim()) {
      setError("יש להזין שם");
      return;
    }

    if (!recipientSignature) {
      setError("יש לחתום חתימה דיגיטלית");
      return;
    }

    setLoading(true);
    try {
      const result = await createRequestBySoldier(token, validRows, {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        recipientSignature,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/request/success");
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-medium text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4" />
          פרטי החייל
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="שם"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="שם מלא"
          />
          <Input
            label="טלפון"
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="טלפון"
            dir="ltr"
          />
        </div>
        <Input
          label="הערות"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות (אופציונלי)"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4" />
            פריטים בהשאלה
          </h4>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="w-4 h-4" />
            הוסף פריט
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const availableItems = row.departmentId
              ? itemsByDepartment[row.departmentId] || []
              : [];
            const selectedItem = allItems.find((i) => i.id === row.itemTypeId);
            const canAdd = !selectedItem || selectedItem.inStock;

            return (
              <div
                key={row.id}
                className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <div className="flex-1 min-w-[140px]">
                  <Select
                    label="מחלקה"
                    value={row.departmentId}
                    onChange={(e) => updateRow(row.id, "departmentId", e.target.value)}
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    placeholder="בחר מחלקה"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select
                    label="פריט"
                    value={row.itemTypeId}
                    onChange={(e) => updateRow(row.id, "itemTypeId", e.target.value)}
                    options={availableItems.map((i) => ({
                      value: i.id,
                      label: getItemLabel({ ...i, departmentId: row.departmentId }, row.id),
                    }))}
                    placeholder={row.departmentId ? "בחר פריט" : "בחר מחלקה קודם"}
                    disabled={!row.departmentId || availableItems.length === 0}
                  />
                </div>
                <div className="w-24">
                  <Input
                    label="כמות"
                    type="number"
                    min={1}
                    max={selectedItem?.inStock ? 999 : 0}
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.id, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="shrink-0 text-slate-500 hover:text-red-600"
                  title="הסר שורה"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">חתימה דיגיטלית</label>
        <SignaturePad
          value={recipientSignature}
          onChange={setRecipientSignature}
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        שלח השאלה
      </Button>
    </form>
  );
}
