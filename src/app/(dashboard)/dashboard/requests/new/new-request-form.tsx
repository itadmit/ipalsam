"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/ui/signature-pad";
import { createRequest } from "@/actions/requests";
import { Package, Clock, Calendar, ChevronDown, ChevronUp, User } from "lucide-react";

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

interface NewRequestFormProps {
  departments: Department[];
  itemsByDepartment: Record<string, Item[]>;
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

export function NewRequestForm({
  departments,
  itemsByDepartment,
}: NewRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState<"immediate" | "scheduled">("immediate");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // תאריכים ושעות
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const availableItems = departmentId ? itemsByDepartment[departmentId] || [] : [];
  const selectedItem = availableItems.find((i) => i.id === itemTypeId);
  const selectedDepartment = departments.find((d) => d.id === departmentId);

  // Generate time slots for selected department
  const timeSlots = useMemo(() => {
    if (!selectedDepartment) return [];
    return generateTimeSlots(
      selectedDepartment.operatingHoursStart,
      selectedDepartment.operatingHoursEnd
    );
  }, [selectedDepartment]);

  // מינימום תאריך - היום
  const today = new Date().toISOString().split("T")[0];
  // מינימום להחזרה - יום אחרי איסוף או היום
  const minReturnDate = pickupDate || today;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!departmentId || !itemTypeId) {
      setError("יש לבחור מחלקה ופריט");
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

    if (selectedItem && quantity > selectedItem.available) {
      setError(`לא ניתן לבקש יותר מ-${selectedItem.available} יחידות`);
      return;
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
      // Combine date and time for scheduled pickup
      let scheduledPickup: Date | undefined;
      if (urgency === "scheduled" && pickupDate && pickupTime) {
        scheduledPickup = new Date(`${pickupDate}T${pickupTime}:00`);
      }

      const result = await createRequest({
        departmentId,
        itemTypeId,
        quantity,
        urgency,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        recipientSignature: recipientSignature || undefined,
        purpose: purpose || undefined,
        notes: notes || undefined,
        scheduledPickupAt: scheduledPickup,
        scheduledReturnAt: returnDate ? new Date(returnDate) : undefined,
      });

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
        <Select
          id="department"
          label="מחלקה"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setItemTypeId("");
            setPickupTime("");
          }}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="בחר מחלקה"
          required
        />

        {selectedDepartment && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="text-blue-800">
              <strong>שעות פעילות:</strong>{" "}
              {selectedDepartment.operatingHoursStart} - {selectedDepartment.operatingHoursEnd}
            </p>
            <div className="flex gap-2 mt-1">
              {selectedDepartment.allowImmediate && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  מיידי ✓
                </span>
              )}
              {selectedDepartment.allowScheduled && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  מתוזמן ✓
                </span>
              )}
            </div>
          </div>
        )}

        <Select
          id="item"
          label="פריט"
          value={itemTypeId}
          onChange={(e) => setItemTypeId(e.target.value)}
          options={availableItems.map((i) => ({
            value: i.id,
            label: `${i.name} (${i.available} זמין)`,
          }))}
          placeholder={departmentId ? "בחר פריט" : "בחר מחלקה קודם"}
          disabled={!departmentId || availableItems.length === 0}
          required
        />

        {selectedItem && (
          <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <Package className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-900">{selectedItem.name}</p>
              <p className="text-sm text-emerald-700">
                {selectedItem.available} יחידות זמינות
              </p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            כמות
          </label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={selectedItem?.available || 999}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
        </div>

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
              disabled={selectedDepartment && !selectedDepartment.allowImmediate}
              className={`p-4 rounded-lg border-2 transition-colors ${
                urgency === "immediate"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${
                selectedDepartment && !selectedDepartment.allowImmediate
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
              disabled={selectedDepartment && !selectedDepartment.allowScheduled}
              className={`p-4 rounded-lg border-2 transition-colors ${
                urgency === "scheduled"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${
                selectedDepartment && !selectedDepartment.allowScheduled
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

        {/* פרטי החייל המקבל */}
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

        {/* מתקדם - אקורדיון */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-right"
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

        {/* תאריך ושעת איסוף - רק למתוזמן */}
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
                      className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
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
          שלח בקשה
        </Button>
      </div>
    </form>
  );
}
