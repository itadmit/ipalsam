"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateVehicle } from "@/actions/vehicles";

interface VehicleEditFormProps {
  vehicleId: string;
  vehicleTypes: { value: string; label: string }[];
  fitnessOptions: { value: string; label: string }[];
  initialData: {
    vehicleNumber: string;
    vehicleType: string;
    vehicleTypeOther: string;
    fitness: string;
    fitnessOther: string;
    lastServiceDate: string;
    fuelCode: string;
    fuelType: string;
  };
}

export function VehicleEditForm({
  vehicleId,
  vehicleTypes,
  fitnessOptions,
  initialData,
}: VehicleEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState(initialData.vehicleNumber);
  const [vehicleType, setVehicleType] = useState(initialData.vehicleType);
  const [vehicleTypeOther, setVehicleTypeOther] = useState(initialData.vehicleTypeOther);
  const [fitness, setFitness] = useState(initialData.fitness);
  const [fitnessOther, setFitnessOther] = useState(initialData.fitnessOther);
  const [lastServiceDate, setLastServiceDate] = useState(initialData.lastServiceDate);
  const [fuelCode, setFuelCode] = useState(initialData.fuelCode);
  const [fuelType, setFuelType] = useState(initialData.fuelType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await updateVehicle(vehicleId, {
        vehicleNumber,
        vehicleType,
        vehicleTypeOther: vehicleType === "אחר" ? vehicleTypeOther : undefined,
        fitness,
        fitnessOther: fitness === "אחר" ? fitnessOther : undefined,
        lastServiceDate: lastServiceDate || undefined,
        fuelCode: fuelCode || undefined,
        fuelType: fuelType || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/vehicles/${vehicleId}`);
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

      <Input
        label="מס׳ רכב"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        required
      />

      <div>
        <Select
          label="סוג רכב"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          options={vehicleTypes}
          required
        />
        {vehicleType === "אחר" && (
          <Input
            className="mt-2"
            value={vehicleTypeOther}
            onChange={(e) => setVehicleTypeOther(e.target.value)}
            placeholder="פרט סוג רכב"
          />
        )}
      </div>

      <div>
        <Select
          label="כשירות רכב"
          value={fitness}
          onChange={(e) => setFitness(e.target.value)}
          options={fitnessOptions}
          required
        />
        {fitness === "אחר" && (
          <Input
            className="mt-2"
            value={fitnessOther}
            onChange={(e) => setFitnessOther(e.target.value)}
            placeholder="פרט כשירות"
          />
        )}
      </div>

      <Input
        label="תאריך טיפול קודם"
        type="date"
        value={lastServiceDate}
        onChange={(e) => setLastServiceDate(e.target.value)}
      />

      <Input
        label="קוד דלק"
        value={fuelCode}
        onChange={(e) => setFuelCode(e.target.value)}
      />

      <Input
        label="סוג דלק"
        value={fuelType}
        onChange={(e) => setFuelType(e.target.value)}
      />

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
          שמור שינויים
        </Button>
      </div>
    </form>
  );
}
