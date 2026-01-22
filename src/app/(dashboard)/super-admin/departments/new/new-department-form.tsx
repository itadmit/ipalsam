"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDepartment } from "@/actions/departments";

interface NewDepartmentFormProps {
  bases: { id: string; name: string }[];
}

export function NewDepartmentForm({ bases }: NewDepartmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseId, setBaseId] = useState(bases[0]?.id || "");
  const [operatingHoursStart, setOperatingHoursStart] = useState("08:00");
  const [operatingHoursEnd, setOperatingHoursEnd] = useState("17:00");
  const [allowImmediate, setAllowImmediate] = useState(true);
  const [allowScheduled, setAllowScheduled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !baseId) {
      setError("יש למלא את כל השדות החובה");
      return;
    }

    setLoading(true);

    try {
      const result = await createDepartment({
        name,
        description: description || undefined,
        baseId,
        operatingHoursStart,
        operatingHoursEnd,
        allowImmediate,
        allowScheduled,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/departments");
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
        {bases.length > 1 && (
          <Select
            id="base"
            label="בסיס"
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
            options={bases.map((b) => ({ value: b.id, label: b.name }))}
            required
          />
        )}

        <Input
          id="name"
          label="שם המחלקה"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="למשל: קשר, נשק, לוגיסטיקה..."
          required
        />

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            תיאור (אופציונלי)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר של המחלקה..."
            rows={3}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="operatingHoursStart"
            label="שעת פתיחה"
            type="time"
            value={operatingHoursStart}
            onChange={(e) => setOperatingHoursStart(e.target.value)}
          />
          <Input
            id="operatingHoursEnd"
            label="שעת סגירה"
            type="time"
            value={operatingHoursEnd}
            onChange={(e) => setOperatingHoursEnd(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            סוגי בקשות מותרים
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowImmediate"
              checked={allowImmediate}
              onChange={(e) => setAllowImmediate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="allowImmediate" className="text-sm text-slate-700">
              אפשר בקשות מיידיות (חייל יכול לקבל היום)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowScheduled"
              checked={allowScheduled}
              onChange={(e) => setAllowScheduled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="allowScheduled" className="text-sm text-slate-700">
              אפשר בקשות מתוזמנות (לתאריך עתידי)
            </label>
          </div>
        </div>
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
          צור מחלקה
        </Button>
      </div>
    </form>
  );
}

