"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateVehicleKilometerage } from "@/actions/vehicles";
import { Pencil } from "lucide-react";

interface KilometerageEditorProps {
  vehicleId: string;
  currentKm: number;
}

export function KilometerageEditor({ vehicleId, currentKm }: KilometerageEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentKm.toString());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return;
    setLoading(true);
    try {
      const result = await updateVehicleKilometerage(vehicleId, num);
      if (!result.error) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24"
        />
        <Button size="sm" onClick={handleSave} loading={loading}>
          שמור
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          ביטול
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 px-2"
      onClick={() => setEditing(true)}
      title="ערוך קילומטראז"
    >
      <Pencil className="w-3 h-3" />
    </Button>
  );
}
