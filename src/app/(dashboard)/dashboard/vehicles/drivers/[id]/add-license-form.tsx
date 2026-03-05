"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDriverLicense } from "@/actions/vehicles";
import { Plus, FileUp, X } from "lucide-react";
import { LICENSE_TYPES } from "@/lib/driver-constants";

interface AddLicenseFormProps {
  driverId: string;
}

export function AddLicenseForm({ driverId }: AddLicenseFormProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [licenseType, setLicenseType] = useState("רישיון");
  const [details, setDetails] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setDocumentUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createDriverLicense({
        driverId,
        licenseType,
        details: details.trim() || undefined,
        expiresAt: expiresAt || undefined,
        documentUrl: documentUrl || undefined,
      });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setExpanded(false);
        setDetails("");
        setExpiresAt("");
        setDocumentUrl("");
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)} className="gap-2">
        <Plus className="w-4 h-4" /> הוסף רישיון/הסמכה/היתר
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Select
        label="סוג"
        value={licenseType}
        onChange={(e) => setLicenseType(e.target.value)}
        options={LICENSE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
      />

      <Input
        label="פרטים"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="למשל: רישיון B, הסמכת אמבולנס"
      />

      <Input
        label="תוקף עד"
        type="date"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">מסמך מצורף</label>
        <input
          ref={docInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleDocFile}
        />
        {documentUrl ? (
          <div className="flex items-center gap-2">
            <img src={documentUrl} alt="מסמך" className="h-12 w-auto rounded" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setDocumentUrl("")} className="text-red-600">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="gap-1">
            <FileUp className="w-4 h-4" /> העלאת תמונה
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)}>
          ביטול
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          הוסף
        </Button>
      </div>
    </form>
  );
}
