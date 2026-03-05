"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitAccidentReport } from "@/actions/vehicles";

interface AccidentReportFormProps {
  departmentId: string;
  defaultReporterName?: string;
  defaultReporterPhone?: string;
  defaultReporterEmail?: string;
}

export function AccidentReportForm({
  departmentId,
  defaultReporterName = "",
  defaultReporterPhone = "",
  defaultReporterEmail = "",
}: AccidentReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [reporterName, setReporterName] = useState(defaultReporterName);
  const [reporterPhone, setReporterPhone] = useState(defaultReporterPhone);
  const [reporterEmail, setReporterEmail] = useState(defaultReporterEmail);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleClassification, setVehicleClassification] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await submitAccidentReport({
        departmentId,
        reporterName,
        reporterPhone,
        reporterEmail: reporterEmail || undefined,
        vehicleNumber,
        vehicleClassification: vehicleClassification || undefined,
        description,
      });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push(`/dashboard/vehicles/accidents?dept=${departmentId}`), 1500);
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-medium text-emerald-600">הדוח נשלח בהצלחה</p>
        <p className="text-sm text-slate-500 mt-2">מפקד מחלקת רכב יקבל את הדוח</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-600">פרטי החייל המדווח</p>
      <Input
        label="שם"
        value={reporterName}
        onChange={(e) => setReporterName(e.target.value)}
        required
      />
      <Input
        label="טלפון"
        type="tel"
        value={reporterPhone}
        onChange={(e) => setReporterPhone(e.target.value)}
        required
      />
      <Input
        label="מייל"
        type="email"
        value={reporterEmail}
        onChange={(e) => setReporterEmail(e.target.value)}
      />

      <Input
        label="מספר רכב"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        required
      />
      <Input
        label="סווג רכב"
        value={vehicleClassification}
        onChange={(e) => setVehicleClassification(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">תיאור האירוע</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תאר את האירוע..."
          rows={5}
          className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
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
          שליחה
        </Button>
      </div>
    </form>
  );
}
