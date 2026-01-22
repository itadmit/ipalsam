"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("מספר טלפון או סיסמה שגויים");
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
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="tel"
            placeholder="מספר טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pr-10"
            dir="ltr"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 pl-10"
            dir="ltr"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 text-base" loading={loading}>
        התחבר
      </Button>

      <p className="text-center text-sm text-slate-500">
        שכחת את הסיסמה?{" "}
        <button type="button" className="text-emerald-600 hover:underline">
          פנה למנהל המערכת
        </button>
      </p>
    </form>
  );
}

