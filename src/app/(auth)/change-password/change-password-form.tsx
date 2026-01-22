"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/actions/auth";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (newPassword.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (newPassword === currentPassword) {
      setError("הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית");
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
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
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type={showPasswords ? "text" : "password"}
            placeholder="סיסמה נוכחית (מספר הטלפון שלך)"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="pr-10"
            dir="ltr"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type={showPasswords ? "text" : "password"}
            placeholder="סיסמה חדשה (מינימום 6 תווים)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pr-10 pl-10"
            dir="ltr"
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPasswords ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type={showPasswords ? "text" : "password"}
            placeholder="אימות סיסמה חדשה"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
            dir="ltr"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-base" loading={loading}>
        שמור סיסמה חדשה
      </Button>
    </form>
  );
}

