"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";

export function ChangePasswordActions() {
  const handleBack = () => signOut({ callbackUrl: "/login" });
  const handleLogout = () => signOut({ callbackUrl: "/login" });

  return (
    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
      <Button
        variant="outline"
        className="w-full sm:w-auto gap-2"
        onClick={handleBack}
      >
        <ArrowRight className="w-4 h-4" />
        חזרה להתחברות
      </Button>
      <Button
        variant="ghost"
        className="w-full sm:w-auto text-slate-600 hover:text-red-600 gap-2"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        התנתקות
      </Button>
    </div>
  );
}
