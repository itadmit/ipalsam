"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { intakeQuantity, addSerialUnit } from "@/actions/inventory";
import { Plus, Package, Trash2 } from "lucide-react";

interface ItemType {
  id: string;
  name: string;
  catalogNumber: string;
  type: "serial" | "quantity";
}

interface IntakeFormProps {
  itemTypes: ItemType[];
  preselectedItemId?: string;
}

interface SerialUnit {
  id: string;
  serialNumber: string;
  assetTag: string;
}

export function IntakeForm({ itemTypes, preselectedItemId }: IntakeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [itemTypeId, setItemTypeId] = useState(preselectedItemId || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  
  // For serial items
  const [serialUnits, setSerialUnits] = useState<SerialUnit[]>([
    { id: "1", serialNumber: "", assetTag: "" }
  ]);

  const selectedItem = itemTypes.find((i) => i.id === itemTypeId);
  const isSerial = selectedItem?.type === "serial";

  const addSerialRow = () => {
    setSerialUnits([
      ...serialUnits,
      { id: Date.now().toString(), serialNumber: "", assetTag: "" }
    ]);
  };

  const removeSerialRow = (id: string) => {
    if (serialUnits.length > 1) {
      setSerialUnits(serialUnits.filter((u) => u.id !== id));
    }
  };

  const updateSerialUnit = (id: string, field: "serialNumber" | "assetTag", value: string) => {
    setSerialUnits(
      serialUnits.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!itemTypeId) {
      setError("יש לבחור סוג ציוד");
      return;
    }

    setLoading(true);

    try {
      if (isSerial) {
        // Add serial units one by one
        const validUnits = serialUnits.filter((u) => u.serialNumber.trim());
        if (validUnits.length === 0) {
          setError("יש להזין לפחות מספר סידורי אחד");
          setLoading(false);
          return;
        }

        let successCount = 0;
        for (const unit of validUnits) {
          const result = await addSerialUnit(
            itemTypeId,
            unit.serialNumber,
            unit.assetTag || undefined,
            notes || undefined
          );
          if (result.success) {
            successCount++;
          } else if (result.error) {
            setError(`שגיאה ביחידה ${unit.serialNumber}: ${result.error}`);
          }
        }

        if (successCount > 0) {
          setSuccess(`נקלטו ${successCount} יחידות בהצלחה`);
          setSerialUnits([{ id: "1", serialNumber: "", assetTag: "" }]);
        }
      } else {
        // Quantity intake
        const result = await intakeQuantity(itemTypeId, quantity, notes || undefined);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(`נקלטו ${quantity} יחידות בהצלחה`);
          setQuantity(1);
        }
      }
      
      router.refresh();
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
      
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <Select
          id="itemType"
          label="סוג ציוד"
          value={itemTypeId}
          onChange={(e) => setItemTypeId(e.target.value)}
          options={itemTypes.map((i) => ({
            value: i.id,
            label: `${i.name} (${i.catalogNumber}) - ${i.type === "serial" ? "סריאלי" : "כמותי"}`,
          }))}
          placeholder="בחר סוג ציוד"
          required
        />

        {selectedItem && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-slate-500">
                  {selectedItem.type === "serial" ? "ציוד סריאלי - יש להזין מספר סידורי לכל יחידה" : "ציוד כמותי - יש להזין כמות"}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSerial ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              יחידות לקליטה
            </label>
            {serialUnits.map((unit, index) => (
              <div key={unit.id} className="flex items-center gap-2">
                <Input
                  placeholder="מספר סידורי *"
                  value={unit.serialNumber}
                  onChange={(e) => updateSerialUnit(unit.id, "serialNumber", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Asset Tag (אופציונלי)"
                  value={unit.assetTag}
                  onChange={(e) => updateSerialUnit(unit.id, "assetTag", e.target.value)}
                  className="flex-1"
                />
                {serialUnits.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSerialRow(unit.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSerialRow}>
              <Plus className="w-4 h-4" />
              הוסף שורה
            </Button>
          </div>
        ) : selectedItem && (
          <Input
            id="quantity"
            label="כמות לקליטה"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
        )}

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            הערות (אופציונלי)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות לקליטה..."
            rows={2}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          חזרה
        </Button>
        <Button type="submit" className="flex-1" loading={loading} disabled={!selectedItem}>
          בצע קליטה
        </Button>
      </div>
    </form>
  );
}

