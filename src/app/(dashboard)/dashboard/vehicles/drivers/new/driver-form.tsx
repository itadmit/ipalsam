"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDriver } from "@/actions/vehicles";

interface DriverFormProps {
  departmentId: string;
}

export function DriverForm({ departmentId }: DriverFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createDriver({
        departmentId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("id" in result) {
        router.push(`/dashboard/vehicles/drivers/${result.id}?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
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

      <Input label="שם מלא" value={name} onChange={(e) => setName(e.target.value)} required />

      <Input label="טלפון" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <Input label="אימייל" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">הערות</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          ביטול
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          שמור
        </Button>
      </div>
    </form>
  );
}
