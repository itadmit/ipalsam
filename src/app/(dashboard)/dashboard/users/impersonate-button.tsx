"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { prepareImpersonate } from "@/actions/auth";
import { LogIn } from "lucide-react";

interface ImpersonateButtonProps {
  userId: string;
  userName: string;
  /** true = אייקון בלבד (טבלה), false = כפתור מלא (עריכת משתמש) */
  compact?: boolean;
}

export function ImpersonateButton({ userId, userName, compact = true }: ImpersonateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm(`התחבר בתור ${userName}? הסיסמה תאופס למספר הטלפון והמשתמש יצטרך להגדיר סיסמה חדשה.`)) return;
    setLoading(true);
    try {
      const result = await prepareImpersonate(userId);
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }
      if (!result.phone) {
        alert("שגיאה");
        setLoading(false);
        return;
      }
      const signInResult = await signIn("credentials", {
        phone: result.phone,
        password: result.phone,
        redirect: false,
      });
      if (signInResult?.error) {
        alert("ההתחברות נכשלה");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "icon" : "default"}
      className={compact ? "" : "w-full gap-2"}
      title="התחבר בתור משתמש זה"
      onClick={handleClick}
      disabled={loading}
    >
      <LogIn className="w-4 h-4" />
      {!compact && "התחבר בתור משתמש זה"}
    </Button>
  );
}
