"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateVehicle, deleteVehicle } from "@/actions/vehicles";
import { FileUp, X, ExternalLink, Trash2 } from "lucide-react";

interface VehicleEditFormProps {
  vehicleId: string;
  departmentId: string;
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
    licenseUrl: string;
  };
}

export function VehicleEditForm({
  vehicleId,
  departmentId,
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
  const [licenseUrl, setLicenseUrl] = useState(initialData.licenseUrl);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleLicenseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLicenseUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
        licenseUrl: licenseUrl || undefined,
      });
      if ("error" in result && result.error) {
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

  const handleDelete = async () => {
    if (deleteConfirmText !== "מחק") return;
    setDeleteLoading(true);
    setError("");
    try {
      const result = await deleteVehicle(vehicleId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/vehicles/list?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה במחיקה");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">רישיון רכב</label>
        <input
          ref={licenseInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLicenseFile}
        />
        {licenseUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
            <img src={licenseUrl} alt="רישיון" className="h-16 w-auto object-contain rounded" />
            <div className="flex-1">
              <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> צפייה ברישיון
              </a>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => licenseInputRef.current?.click()}>
                <FileUp className="w-4 h-4" /> החלף
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLicenseUrl("")} className="text-red-600">
                <X className="w-4 h-4" /> הסר
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => licenseInputRef.current?.click()} className="gap-2">
            <FileUp className="w-4 h-4" /> העלאת רישיון רכב (תמונה)
          </Button>
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
          שמור שינויים
        </Button>
      </div>

      <hr className="border-slate-200" />

      <div>
        <Button
          type="button"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4" />
          מחיקת רכב
        </Button>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 space-y-3">
            <p className="text-sm text-red-800 font-medium">אימות כפול – הזן &quot;מחק&quot; לאישור</p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="מחק"
              dir="ltr"
              className="text-center"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
              >
                ביטול
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deleteConfirmText !== "מחק"}
                loading={deleteLoading}
                onClick={handleDelete}
              >
                מחק רכב
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
