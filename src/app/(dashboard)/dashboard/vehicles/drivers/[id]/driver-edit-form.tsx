"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDriver, deleteDriver } from "@/actions/vehicles";
import { Pencil, Trash2 } from "lucide-react";

interface DriverEditFormProps {
  driverId: string;
  departmentId: string;
  initialData: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
}

export function DriverEditForm({ driverId, departmentId, initialData }: DriverEditFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone);
  const [email, setEmail] = useState(initialData.email);
  const [notes, setNotes] = useState(initialData.notes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await updateDriver(driverId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("למחוק את הנהג וכל הרישיונות שלו?")) return;
    setDeleteLoading(true);
    setError("");
    try {
      const result = await deleteDriver(driverId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/vehicles/drivers?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div>
          <p className="text-sm text-slate-500">שם</p>
          <p className="font-medium">{name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">טלפון</p>
          <p className="font-medium">{phone || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">אימייל</p>
          <p className="font-medium">{email || "-"}</p>
        </div>
        {notes && (
          <div>
            <p className="text-sm text-slate-500">הערות</p>
            <p className="font-medium">{notes}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
            <Pencil className="w-4 h-4" /> עריכה
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
            loading={deleteLoading}
          >
            <Trash2 className="w-4 h-4" /> מחיקה
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
          ביטול
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          שמור
        </Button>
      </div>
    </form>
  );
}
