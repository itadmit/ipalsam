"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, ScanBarcode, SearchX } from "lucide-react";
import { validateStoreLink } from "@/actions/soldier-request";

function ProfileEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await validateStoreLink(phone);
      if ("error" in result) {
        setError(result.error || "שגיאה");
      } else {
        router.push(`/profile/${result.phoneDigits}`);
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await validateStoreLink(barcode);
      if ("error" in result) {
        setError(result.error || "שגיאה");
      } else {
        router.push(`/profile/${result.phoneDigits}`);
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const errorParam = searchParams.get("error");
  if (errorParam) {
    const errorMsg = decodeURIComponent(errorParam);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">העמוד לא נמצא</h1>
          <p className="text-slate-500 mb-6">{errorMsg}</p>
          <Link href="/profile">
            <Button className="gap-2">
              <Store className="w-4 h-4" />
              נסה שוב
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">תחבורת מהיר</h1>
          <p className="text-slate-500 mt-1">
            הזן טלפון של מוסר הציוד או סרוק את לינק החנות
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleStoreSubmit} className="space-y-3">
            <div className="relative">
              <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="tel"
                placeholder="טלפון מוסר הציוד"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pr-10 text-lg"
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              כניסה לחנות
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-400">או</span>
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <div className="relative">
              <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="סרוק לינק החנות"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pr-10"
                dir="ltr"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" loading={loading}>
              סרוק לינק
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ProfileEntryContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <ProfileEntryForm />
    </Suspense>
  );
}
