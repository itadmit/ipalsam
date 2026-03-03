"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOpenRequestFromPublicStore } from "@/actions/open-requests";
import { identifyOrCreateSoldier, searchSoldiersByPhone } from "@/actions/soldier-request";
import { Package, Plus, Minus, Trash2, Send, User, Check } from "lucide-react";

interface OpenRequestPageContentProps {
  departmentId: string;
  handoverPhone: string;
  storeName: string;
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

export function OpenRequestPageContent({
  departmentId,
  handoverPhone,
  storeName,
}: OpenRequestPageContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneMatches, setPhoneMatches] = useState<
    { id: string; phone: string; name: string; role?: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userSelected, setUserSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<ItemRow[]>([
    { id: generateId(), itemName: "", quantity: 1, notes: "" },
  ]);

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

  const searchPhone = useCallback(async (value: string, skipOpenDropdown = false) => {
    if (value.replace(/\D/g, "").length < 2) {
      setPhoneMatches([]);
      setShowDropdown(false);
      return;
    }
    try {
      const result = await searchSoldiersByPhone(value);
      const matches = "matches" in result ? result.matches : [];
      setPhoneMatches(matches);
      if (!skipOpenDropdown) setShowDropdown(true);
    } catch {
      setPhoneMatches([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPhone(phone, userSelected), 150);
    return () => clearTimeout(t);
  }, [phone, searchPhone, userSelected]);

  const selectMatch = useCallback((match: { id: string; phone: string; name: string }) => {
    setPhone(match.phone);
    setFullName(match.name);
    setShowDropdown(false);
    setPhoneMatches([]);
    setUserSelected(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validItems = rows.filter(
      (r) => (r.itemName || "").trim().length > 0 && (r.quantity || 0) > 0
    );
    if (validItems.length === 0) {
      setError("יש להוסיף לפחות פריט אחד");
      return;
    }
    if (!phone.trim()) {
      setError("יש להזין טלפון");
      return;
    }
    if (!fullName.trim()) {
      setError("יש להזין שם מלא");
      return;
    }

    setLoading(true);
    try {
      let requesterId: string | null = null;

      const identifyFirst = await identifyOrCreateSoldier(phone);
      if ("userId" in identifyFirst && identifyFirst.userId) {
        requesterId = identifyFirst.userId;
        if (identifyFirst.soldierName) setFullName(identifyFirst.soldierName);
      } else if ("needCreate" in identifyFirst && fullName.trim()) {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || fullName.trim();
        const result = await identifyOrCreateSoldier(phone, {
          firstName,
          lastName,
          departmentId,
        });
        if ("error" in result) {
          setError(result.error || "");
          setLoading(false);
          return;
        }
        if ("userId" in result && result.userId) {
          requesterId = result.userId;
        }
      } else if ("error" in identifyFirst) {
        setError(identifyFirst.error || "");
        setLoading(false);
        return;
      }

      if (!requesterId) {
        setError("לא ניתן לזהות את המבקש. אנא נסה שוב");
        setLoading(false);
        return;
      }

      const result = await createOpenRequestFromPublicStore(
        departmentId,
        handoverPhone,
        validItems.map((r) => ({
          itemName: r.itemName.trim(),
          quantity: r.quantity,
          notes: r.notes.trim() || undefined,
        })),
        requesterId
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setRows([{ id: generateId(), itemName: "", quantity: 1, notes: "" }]);
        setTimeout(() => {
          router.push(`/profile/${handoverPhone}`);
        }, 1500);
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-12">
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">בקשה חדשה</h2>
              <p className="text-sm text-slate-500">
                ניתן להזמין בטופס הבא ציוד מ־{storeName}. הוא יקבל התראה ויצטרך לאשר ידנית.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              הבקשה נשלחה בהצלחה!
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              פרטי המבקש
            </h4>
            <div className="space-y-3">
              <div className="relative" ref={dropdownRef}>
                <Input
                  label="טלפון"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setFullName("");
                    setUserSelected(false);
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onFocus={() => !userSelected && phone.replace(/\D/g, "").length >= 2 && setShowDropdown(true)}
                  placeholder="הזן טלפון"
                  dir="ltr"
                  required
                  className="text-base"
                />
                {userSelected && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="font-medium">המבקש זוהה</span>
                  </div>
                )}
                {showDropdown && !userSelected && phone.replace(/\D/g, "").length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-48 overflow-auto">
                    {phoneMatches.length > 0 ? (
                      phoneMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 flex flex-col items-end"
                          onClick={() => selectMatch(m)}
                        >
                          <span className="font-medium">{m.name}</span>
                          <span className="text-slate-500 text-xs" dir="ltr">{m.phone}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        לא נמצאו תוצאות – הזן שם המבקש ליצירת משתמש
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Input
                label="שם המבקש"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="שם המבקש"
                required
                className="text-base"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <label className="text-sm font-medium text-slate-700 block mb-3">פריטים</label>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="p-3 rounded-lg bg-white border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      label="שם פריט"
                      placeholder="שם הפריט"
                      value={row.itemName}
                      onChange={(e) => updateRow(row.id, "itemName", e.target.value)}
                      className="text-base flex-1 min-w-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="shrink-0 h-8 w-8 text-slate-400 hover:text-red-500 self-end"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
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
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
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
              className="w-full gap-1.5 h-10 border-dashed border-2 text-slate-500 hover:text-slate-700 hover:border-slate-300"
            >
              <Plus className="w-4 h-4" />
              הוסף פריט
            </Button>
          </div>

          <Button type="submit" className="w-full h-11" size="lg" loading={loading} disabled={success}>
            שלח בקשה
          </Button>
        </form>
      </div>
    </div>
  );
}
