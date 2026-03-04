"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetUserPassword } from "@/actions/auth";
import { KeyRound } from "lucide-react";

interface ResetPasswordButtonProps {
  userId: string;
}

export function ResetPasswordButton({ userId }: ResetPasswordButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!confirm("לאפס את הסיסמה למספר הטלפון? המשתמש יצטרך להגדיר סיסמה חדשה בהתחברות הבאה.")) return;
    setError("");
    setLoading(true);
    try {
      const result = await resetUserPassword(userId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        alert("הסיסמה אופסה בהצלחה. המשתמש יכנס עם מספר הטלפון ויצטרך להגדיר סיסמה חדשה.");
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleClick}
        disabled={loading}
      >
        <KeyRound className="w-4 h-4" />
        {loading ? "מאפס..." : "איפוס סיסמה"}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
