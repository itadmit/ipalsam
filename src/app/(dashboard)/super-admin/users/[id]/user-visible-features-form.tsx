"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateUserVisibleFeatures } from "@/actions/users";
import {
  VISIBLE_FEATURE_KEYS,
  VISIBLE_FEATURE_LABELS,
  type VisibleFeatures,
} from "@/lib/visible-features";

interface UserVisibleFeaturesFormProps {
  userId: string;
  initialFeatures: VisibleFeatures | null;
}

const MAIN_FEATURES = [
  "dashboard",
  "inventory",
  "requests",
  "handover",
  "loans",
  "open-requests",
  "my-open-requests",
  "profile",
  "profile-edit",
  "schedule",
  "departments",
  "users",
] as const;

const ADMIN_FEATURES = [
  "super-admin-area",
  "base",
  "categories",
  "reports",
  "audit-log",
  "settings",
] as const;

export function UserVisibleFeaturesForm({
  userId,
  initialFeatures,
}: UserVisibleFeaturesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [features, setFeatures] = useState<VisibleFeatures>(() => {
    const f: VisibleFeatures = {};
    for (const key of VISIBLE_FEATURE_KEYS) {
      f[key] = initialFeatures?.[key] ?? true;
    }
    return f;
  });

  const handleToggle = (key: (typeof VISIBLE_FEATURE_KEYS)[number], checked: boolean) => {
    setFeatures((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSelectAll = (keys: readonly (typeof VISIBLE_FEATURE_KEYS)[number][], checked: boolean) => {
    setFeatures((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        next[key] = checked;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await updateUserVisibleFeatures(userId, features);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <p className="text-sm text-slate-600 mb-3">
          בחר אילו פיצ׳רים יוצגו למשתמש בתפריט. אם לא מסומן – יוצג לפי תפקיד.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">ראשי</span>
              <button
                type="button"
                onClick={() => handleSelectAll(MAIN_FEATURES, true)}
                className="text-xs text-emerald-600 hover:underline"
              >
                בחר הכל
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {MAIN_FEATURES.map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features[key] ?? true}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm">{VISIBLE_FEATURE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">ניהול</span>
              <button
                type="button"
                onClick={() => handleSelectAll(ADMIN_FEATURES, true)}
                className="text-xs text-emerald-600 hover:underline"
              >
                בחר הכל
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {ADMIN_FEATURES.map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features[key] ?? true}
                    onChange={(e) => handleToggle(key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-sm">{VISIBLE_FEATURE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" size="sm" loading={loading}>
        שמור פיצ׳רים
      </Button>
    </form>
  );
}
