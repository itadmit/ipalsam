"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createItemTypesBulk } from "@/actions/inventory";
import { Plus, Trash2, FileSpreadsheet } from "lucide-react";
import type { CreateItemTypeFormData } from "@/types";

interface BulkItemFormProps {
  departments: { id: string; name: string }[];
  categoriesByDepartment: Record<string, { id: string; name: string }[]>;
  userDepartmentId: string | null;
  userRole: string;
}

const emptyRow = (departmentId: string): CreateItemTypeFormData => ({
  departmentId,
  name: "",
  catalogNumber: "",
  type: "quantity",
  quantityTotal: 0,
  minimumAlert: 0,
  requiresDoubleApproval: false,
  maxLoanDays: 0,
});

export function BulkItemForm({
  departments,
  categoriesByDepartment,
  userDepartmentId,
  userRole,
}: BulkItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const canSelectDepartment = userRole === "super_admin" || userRole === "hq_commander";
  const fixedDeptId = userDepartmentId || "";
  const defaultDeptId = canSelectDepartment ? (departments[0]?.id || "") : fixedDeptId;

  const [defaultDepartmentId, setDefaultDepartmentId] = useState(defaultDeptId);
  const [rows, setRows] = useState<CreateItemTypeFormData[]>(() => [
    emptyRow(canSelectDepartment ? (departments[0]?.id || "") : fixedDeptId),
  ]);

  const updateRow = useCallback((index: number, field: keyof CreateItemTypeFormData, value: unknown) => {
    setRows((prev) => {
      const next = [...prev];
      (next[index] as Record<string, unknown>)[field] = value;
      if (field === "departmentId") {
        (next[index] as CreateItemTypeFormData).categoryId = "";
      }
      return next;
    });
  }, []);

  const addRow = () => {
    const deptId = canSelectDepartment
      ? (defaultDepartmentId || rows[0]?.departmentId || departments[0]?.id || "")
      : fixedDeptId;
    setRows((prev) => [...prev, emptyRow(deptId)]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return;

    const separator = text.includes("\t") ? "\t" : ",";
    const parsed: CreateItemTypeFormData[] = [];
    const deptId = canSelectDepartment
      ? (defaultDepartmentId || departments[0]?.id || "")
      : fixedDeptId;

    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i].split(separator).map((c) => c.trim());
      const name = cells[0] || "";
      if (!name) continue;

      const catalogNumber = cells[1] || "";
      const typeStr = (cells[2] || "כמותי").toLowerCase();
      const type: "quantity" | "serial" = typeStr.includes("סריאלי") || typeStr === "serial" ? "serial" : "quantity";
      const quantityTotal = parseInt(cells[3] || "0", 10) || 0;
      const minimumAlert = parseInt(cells[4] || "0", 10) || 0;
      const maxLoanDays = parseInt(cells[5] || "0", 10) || 0;

      parsed.push({
        departmentId: deptId,
        name,
        catalogNumber,
        type,
        quantityTotal: type === "quantity" ? quantityTotal : 0,
        minimumAlert,
        requiresDoubleApproval: false,
        maxLoanDays: maxLoanDays || undefined,
      });
    }

    if (parsed.length > 0) {
      e.preventDefault();
      setRows(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const validRows = rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        ...r,
        departmentId: canSelectDepartment ? (r.departmentId || defaultDepartmentId) : fixedDeptId,
      }));
    if (validRows.length === 0) {
      setError("יש להזין לפחות פריט אחד עם שם");
      return;
    }

    setLoading(true);
    try {
      const result = await createItemTypesBulk(validRows);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMsg(`נוצרו ${result.created} פריטים בהצלחה${result.failed ? `. ${result.failed} נכשלו.` : ""}`);
        if (result.errors?.length) {
          setError(result.errors.join("\n"));
        }
        if (result.created > 0) {
          router.refresh();
          const deptId = canSelectDepartment
            ? (defaultDepartmentId || departments[0]?.id || "")
            : fixedDeptId;
          setRows([emptyRow(deptId)]);
        }
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full min-w-[100px] h-9 rounded border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onPaste={handlePaste}>
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {canSelectDepartment && (
          <div className="w-48">
            <Select
              id="defaultDept"
              label="מחלקה ברירת מחדל"
              value={defaultDepartmentId}
              onChange={(e) => {
                setDefaultDepartmentId(e.target.value);
                setRows((prev) => prev.map((r) => ({ ...r, departmentId: e.target.value, categoryId: "" })));
              }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="בחר מחלקה"
            />
          </div>
        )}
        <div className="flex gap-2 pt-6">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="w-4 h-4" />
            הוסף שורה
          </Button>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4" />
            הדבק מאקסל (עמודות מופרדות בטאב)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-right p-2 font-semibold text-slate-600 w-10">#</th>
              {canSelectDepartment && (
                <th className="text-right p-2 font-semibold text-slate-600 min-w-[120px]">מחלקה</th>
              )}
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[100px]">קטגוריה</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[140px]">שם מוצר *</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[90px]">מק״ט</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[90px]">סוג</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[70px]">כמות</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[70px]">התראה</th>
              <th className="text-right p-2 font-semibold text-slate-600 min-w-[70px]">ימי השאלה</th>
              <th className="text-right p-2 font-semibold text-slate-600 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const deptId = canSelectDepartment ? (row.departmentId || defaultDepartmentId) : fixedDeptId;
              const categories = deptId ? (categoriesByDepartment[deptId] || []) : [];
              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-1 text-slate-500">{i + 1}</td>
                  {canSelectDepartment && (
                    <td className="p-1">
                      <select
                        value={row.departmentId}
                        onChange={(e) => updateRow(i, "departmentId", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">בחר</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="p-1">
                    <select
                      value={row.categoryId || ""}
                      onChange={(e) => updateRow(i, "categoryId", e.target.value)}
                      className={inputClass}
                      disabled={!deptId || categories.length === 0}
                    >
                      <option value="">—</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(i, "name", e.target.value)}
                      placeholder="שם מוצר"
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.catalogNumber || ""}
                      onChange={(e) => updateRow(i, "catalogNumber", e.target.value)}
                      placeholder="מק״ט"
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1">
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(i, "type", e.target.value as "quantity" | "serial")}
                      className={inputClass}
                    >
                      <option value="quantity">כמותי</option>
                      <option value="serial">סריאלי</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      min={0}
                      value={row.type === "quantity" ? row.quantityTotal || 0 : ""}
                      onChange={(e) =>
                        updateRow(i, "quantityTotal", parseInt(e.target.value, 10) || 0)
                      }
                      className={inputClass}
                      disabled={row.type === "serial"}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      min={0}
                      value={row.minimumAlert || 0}
                      onChange={(e) =>
                        updateRow(i, "minimumAlert", parseInt(e.target.value, 10) || 0)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      min={0}
                      value={row.maxLoanDays || 0}
                      onChange={(e) =>
                        updateRow(i, "maxLoanDays", parseInt(e.target.value, 10) || 0)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(i)}
                      disabled={rows.length <= 1}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          ביטול
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          ייבא {rows.filter((r) => r.name?.trim()).length} פריטים
        </Button>
      </div>
    </form>
  );
}
