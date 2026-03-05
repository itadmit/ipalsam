"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteDriverLicense, updateDriverLicense } from "@/actions/vehicles";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

type License = {
  id: string;
  licenseType: string;
  details: string | null;
  expiresAt: Date | null;
  documentUrl: string | null;
};

interface LicenseListProps {
  driverId: string;
  licenses: License[];
}

export function LicenseList({ driverId, licenses }: LicenseListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק רישיון זה?")) return;
    await deleteDriverLicense(id);
    router.refresh();
  };

  const startEdit = (lic: License) => {
    setEditingId(lic.id);
    setEditDetails(lic.details || "");
    setEditExpiresAt(lic.expiresAt?.toISOString().slice(0, 10) || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateDriverLicense(editingId, {
      details: editDetails || undefined,
      expiresAt: editExpiresAt || undefined,
    });
    setEditingId(null);
    router.refresh();
  };

  const isExpired = (d: Date | null) => d && new Date(d) < new Date();

  if (licenses.length === 0) {
    return <p className="text-sm text-slate-500">אין רישיונות עדיין</p>;
  }

  return (
    <div className="space-y-3">
      {licenses.map((lic) => (
        <div
          key={lic.id}
          className="p-4 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3"
        >
          {editingId === lic.id ? (
            <div className="flex-1 space-y-2">
              <input
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                placeholder="פרטים"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  שמור
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{lic.licenseType}</Badge>
                  {lic.expiresAt && isExpired(lic.expiresAt) && (
                    <Badge variant="destructive">פג תוקף</Badge>
                  )}
                </div>
                {lic.details && <p className="text-sm mt-1">{lic.details}</p>}
                {lic.expiresAt && (
                  <p className="text-xs text-slate-500 mt-1">תוקף עד: {formatDate(lic.expiresAt)}</p>
                )}
                {lic.documentUrl && (
                  <a
                    href={lic.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> צפייה במסמך
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(lic)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                  onClick={() => handleDelete(lic.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
