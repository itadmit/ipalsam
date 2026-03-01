"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/ui/signature-pad";
import { createRequestsBatch } from "@/actions/requests";
import {
  Package,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  allowImmediate: boolean;
  allowScheduled: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
}

interface Item {
  id: string;
  name: string;
  available: number;
}

interface RecentSuggestion {
  itemTypeId: string;
  departmentId: string;
  name: string;
}

interface NewRequestFormProps {
  departments: Department[];
  itemsByDepartment: Record<string, Item[]>;
  recentSuggestions?: RecentSuggestion[];
}

interface RequestRow {
  id: string;
  departmentId: string;
  itemTypeId: string;
  quantity: number;
}

// Generate time slots based on operating hours
function generateTimeSlots(startHour: string, endHour: string): string[] {
  const slots: string[] = [];
  const [startH] = startHour.split(":").map(Number);
  const [endH] = endHour.split(":").map(Number);

  for (let hour = startH; hour < endH; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  return slots;
}

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NewRequestForm({
  departments,
  itemsByDepartment,
  recentSuggestions = [],
}: NewRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState<RequestRow[]>([
    { id: generateRowId(), departmentId: "", itemTypeId: "", quantity: 1 },
  ]);
  const [urgency, setUrgency] = useState<"immediate" | "scheduled">("immediate");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const firstDeptWithSelection = rows.find((r) => r.departmentId)?.departmentId;
  const deptForUrgency =
    departments.find((d) => d.id === firstDeptWithSelection) ?? departments[0];

  const timeSlots = useMemo(() => {
    const dept = departments.find((d) => d.id === firstDeptWithSelection);
    if (!dept) return [];
    return generateTimeSlots(dept.operatingHoursStart, dept.operatingHoursEnd);
  }, [departments, firstDeptWithSelection]);

  const today = new Date().toISOString().split("T")[0];
  const minReturnDate = pickupDate || today;

  // חישוב זמינות מעודכנת לפי שורות אחרות בטופס
  const getAvailableForItem = (itemId: string, excludeRowId?: string) => {
    const item = Object.values(itemsByDepartment)
      .flat()
      .find((i) => i.id === itemId);
    if (!item) return 0;
    const requestedInForm = rows
      .filter((r) => r.itemTypeId === itemId && r.id !== excludeRowId)
      .reduce((sum, r) => sum + r.quantity, 0);
    return Math.max(0, item.available - requestedInForm);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: generateRowId(), departmentId: "", itemTypeId: "", quantity: 1 },
    ]);
  };

  const addRowFromSuggestion = (itemTypeId: string, departmentId: string) => {
    const avail = getAvailableForItem(itemTypeId);
    if (avail < 1) return;
    setRows((prev) => {
      const firstEmptyIdx = prev.findIndex((r) => !r.departmentId && !r.itemTypeId);
      if (firstEmptyIdx >= 0) {
        return prev.map((r, i) =>
          i === firstEmptyIdx
            ? { ...r, departmentId, itemTypeId, quantity: 1 }
            : r
        );
      }
      return [
        ...prev,
        {
          id: generateRowId(),
          departmentId,
          itemTypeId,
          quantity: 1,
        },
      ];
    });
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
        if (field === "departmentId") {
          next.itemTypeId = "";
        }
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

    if (!recipientName.trim()) {
      setError("יש להזין שם החייל המקבל");
      return;
    }

    if (!recipientSignature) {
      setError("יש לחתום חתימה דיגיטלית");
      return;
    }

    for (const row of validRows) {
      const avail = getAvailableForItem(row.itemTypeId);
      if (row.quantity > avail) {
        const item = Object.values(itemsByDepartment)
          .flat()
          .find((i) => i.id === row.itemTypeId);
        setError(
          `לא ניתן לבקש יותר מ-${avail} יחידות עבור "${item?.name || "פריט"}"`
        );
        return;
      }
    }

    if (urgency === "scheduled" && !pickupDate) {
      setError("יש לבחור תאריך איסוף");
      return;
    }

    if (urgency === "scheduled" && !pickupTime) {
      setError("יש לבחור שעת איסוף");
      return;
    }

    setLoading(true);

    try {
      let scheduledPickup: Date | undefined;
      if (urgency === "scheduled" && pickupDate && pickupTime) {
        scheduledPickup = new Date(`${pickupDate}T${pickupTime}:00`);
      }

      const result = await createRequestsBatch(
        validRows.map((r) => ({
          departmentId: r.departmentId,
          itemTypeId: r.itemTypeId,
          quantity: r.quantity,
        })),
        {
          urgency,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim() || undefined,
          recipientSignature: recipientSignature || undefined,
          purpose: purpose || undefined,
          notes: notes || undefined,
          scheduledPickupAt: scheduledPickup,
          scheduledReturnAt: returnDate ? new Date(returnDate) : undefined,
        }
      );

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/requests");
        router.refresh();
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
        {/* שורות פריטים */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              פריטים בהשאלה
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              הוסף פריט
            </Button>
          </div>

          {recentSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                הושאלו לאחרונה:
              </span>
              {recentSuggestions.map((s) => {
                const avail = getAvailableForItem(s.itemTypeId);
                const canAdd = avail >= 1;
                return (
                  <Button
                    key={s.itemTypeId}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => canAdd && addRowFromSuggestion(s.itemTypeId, s.departmentId)}
                    disabled={!canAdd}
                    className="h-8 text-xs border border-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50"
                  >
                    {s.name}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row) => {
              const availableItems =
                row.departmentId ? itemsByDepartment[row.departmentId] || [] : [];
              const available = getAvailableForItem(row.itemTypeId, row.id);

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
                        label: `${i.name} (${getAvailableForItem(i.id, row.id)} זמין)`,
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
                      max={available || 999}
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

        {deptForUrgency ? (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="text-blue-800">
              <strong>שעות פעילות:</strong>{" "}
              {deptForUrgency.operatingHoursStart} - {deptForUrgency.operatingHoursEnd}
            </p>
            <div className="flex gap-2 mt-1">
              {deptForUrgency.allowImmediate && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  מיידי ✓
                </span>
              )}
              {deptForUrgency.allowScheduled && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  מתוזמן ✓
                </span>
              )}
            </div>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            דחיפות
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setUrgency("immediate");
                setPickupDate("");
                setPickupTime("");
              }}
              disabled={deptForUrgency && !deptForUrgency.allowImmediate}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer active:scale-[0.98] ${
                urgency === "immediate"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${
                deptForUrgency && !deptForUrgency.allowImmediate
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <Clock
                className={`w-5 h-5 mx-auto mb-2 ${
                  urgency === "immediate" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  urgency === "immediate" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                מיידי
              </p>
              <p className="text-xs text-slate-500 mt-1">אקח היום</p>
            </button>
            <button
              type="button"
              onClick={() => setUrgency("scheduled")}
              disabled={deptForUrgency && !deptForUrgency.allowScheduled}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer active:scale-[0.98] ${
                urgency === "scheduled"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${
                deptForUrgency && !deptForUrgency.allowScheduled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <Calendar
                className={`w-5 h-5 mx-auto mb-2 ${
                  urgency === "scheduled" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  urgency === "scheduled" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                מתוזמן
              </p>
              <p className="text-xs text-slate-500 mt-1">לתאריך עתידי</p>
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            פרטי החייל המקבל
          </h4>
          <Input
            id="recipientName"
            label="שם החייל המקבל (חובה)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="שם מלא"
            required
          />
          <Input
            id="recipientPhone"
            label="טלפון"
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="050-0000000"
            dir="ltr"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              חתימה דיגיטלית (חובה)
            </label>
            <SignaturePad
              value={recipientSignature}
              onChange={setRecipientSignature}
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-right cursor-pointer"
          >
            <span className="font-medium text-slate-900">מתקדם</span>
            {advancedOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {advancedOpen && (
            <div className="p-4 space-y-4 border-t border-slate-200">
              <Input
                id="returnDate"
                label="תאריך החזרה מתוכנן"
                type="date"
                value={returnDate}
                min={minReturnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
              <Input
                id="purpose"
                label="מטרה"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="לאיזה צורך נדרש הציוד?"
              />
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  הערות
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערות נוספות..."
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {urgency === "scheduled" && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-900">בחירת מועד איסוף</h4>

            <div>
              <label
                htmlFor="pickupDate"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                תאריך איסוף
              </label>
              <Input
                id="pickupDate"
                type="date"
                value={pickupDate}
                min={today}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  setPickupTime("");
                  if (returnDate && e.target.value > returnDate) {
                    setReturnDate("");
                  }
                }}
                required
              />
            </div>

            {pickupDate && timeSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  שעת איסוף
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPickupTime(slot)}
                      className={`py-2 px-3 text-sm rounded-lg border transition-colors cursor-pointer active:scale-[0.98] ${
                        pickupTime === slot
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  בחר שעה מתוך שעות הפעילות של המחלקה
                </p>
              </div>
            )}
          </div>
        )}
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
          שלח השאלה
        </Button>
      </div>
    </form>
  );
}
