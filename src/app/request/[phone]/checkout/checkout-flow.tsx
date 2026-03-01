"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Card, CardContent } from "@/components/ui/card";
import {
  identifyOrCreateSoldier,
  createRequestBySoldier,
  getSoldierRequestData,
  searchSoldiersByPhone,
} from "@/actions/soldier-request";
import Link from "next/link";
import { User, Package, ArrowRight } from "lucide-react";

interface CheckoutFlowProps {
  handoverPhone: string;
  storeName: string;
  department: { id: string; name: string };
  items: { id: string; name: string; departmentId: string; inStock: boolean }[];
}

interface CartItem {
  departmentId: string;
  itemTypeId: string;
  quantity: number;
}

export function CheckoutFlow({
  handoverPhone,
  storeName,
  department,
  items,
}: CheckoutFlowProps) {
  const router = useRouter();
  const [rows, setRows] = useState<
    { id: string; departmentId: string; itemTypeId: string; quantity: number }[]
  >([]);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [phoneMatches, setPhoneMatches] = useState<{ id: string; phone: string; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cartStr = typeof window !== "undefined" ? sessionStorage.getItem("request-cart") : null;
    if (!cartStr) {
      router.replace(`/request/${handoverPhone}`);
      return;
    }
    try {
      const cart: CartItem[] = JSON.parse(cartStr);
      setRows(
        cart.map((c) => ({
          id: `row-${c.itemTypeId}-${c.quantity}`,
          departmentId: c.departmentId,
          itemTypeId: c.itemTypeId,
          quantity: c.quantity,
        }))
      );
    } catch {
      router.replace(`/request/${handoverPhone}`);
    }
  }, [handoverPhone, router]);

  const searchPhone = useCallback(async (value: string) => {
    if (value.replace(/\D/g, "").length < 3) {
      setPhoneMatches([]);
      return;
    }
    try {
      const result = await searchSoldiersByPhone(value);
      const matches = "matches" in result ? result.matches : [];
      setPhoneMatches(matches);
      setShowDropdown(matches.length > 0);
    } catch {
      setPhoneMatches([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPhone(phone), 300);
    return () => clearTimeout(t);
  }, [phone, searchPhone]);

  const selectMatch = useCallback(async (match: { id: string; phone: string; name: string }) => {
    setPhone(match.phone);
    setFullName(match.name);
    setShowDropdown(false);
    setPhoneMatches([]);
    const result = await identifyOrCreateSoldier(match.phone);
    if ("token" in result && result.token) {
      setToken(result.token);
    }
  }, []);

  useEffect(() => {
    if (token || phoneMatches.length !== 1 || !phone.trim()) return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) return;
    const m = phoneMatches[0];
    const mDigits = (m.phone || "").replace(/\D/g, "").slice(-10);
    const isExactMatch =
      digits === mDigits || digits.endsWith(mDigits) || mDigits.endsWith(digits);
    if (isExactMatch) {
      const t = setTimeout(() => selectMatch(m), 500);
      return () => clearTimeout(t);
    }
  }, [phoneMatches, phone, token, selectMatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validRows = rows.filter((r) => r.departmentId && r.itemTypeId && r.quantity > 0);
    if (validRows.length === 0) {
      setError("אין פריטים בהזמנה");
      return;
    }
    if (!phone.trim()) {
      setError("יש להזין טלפון");
      return;
    }
    if (!fullName.trim()) {
      setError("יש להזין שם מלא");
      return;
    }
    if (!signature) {
      setError("יש לחתום חתימה דיגיטלית");
      return;
    }

    setLoading(true);
    try {
      let reqToken = token;
      if (!reqToken) {
        const identifyFirst = await identifyOrCreateSoldier(phone);
        if ("error" in identifyFirst) {
          setError(identifyFirst.error || "");
          setLoading(false);
          return;
        }
        if ("token" in identifyFirst && identifyFirst.token) {
          reqToken = identifyFirst.token;
          setToken(identifyFirst.token);
          setFullName(identifyFirst.soldierName);
        } else if ("needCreate" in identifyFirst && fullName.trim()) {
          const nameParts = fullName.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || fullName.trim();
          const result = await identifyOrCreateSoldier(phone, {
            firstName,
            lastName,
            departmentId: department.id,
          });
          if ("error" in result) {
            setError(result.error || "");
            setLoading(false);
            return;
          }
          if ("token" in result && result.token) {
            reqToken = result.token;
          }
        }
      }

      if (!reqToken) {
        setError("לא ניתן לזהות את המשתמש");
        setLoading(false);
        return;
      }

      const result = await createRequestBySoldier(
        reqToken,
        validRows,
        {
          recipientName: fullName.trim(),
          recipientPhone: phone.trim() || undefined,
          recipientSignature: signature,
          notes: notes.trim() || undefined,
        },
        handoverPhone
      );

      if (result.error) {
        setError(result.error || "");
      } else {
        sessionStorage.removeItem("request-cart");
        sessionStorage.removeItem("request-from");
        router.push("/request/success");
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const cartSummary = rows
    .filter((r) => r.itemTypeId)
    .map((r) => {
      const item = items.find((i) => i.id === r.itemTypeId);
      return item ? `${item.name} × ${r.quantity}` : null;
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">צ׳ק אוט – {storeName}</h1>
          <p className="text-slate-500 mt-1">{department.name}</p>
          <Link
            href={`/request/${handoverPhone}`}
            className="text-sm text-emerald-600 hover:underline inline-flex items-center gap-1 mt-2"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לחנות
          </Link>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {cartSummary.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
                <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  פריטים בהזמנה
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {cartSummary.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  פרטי החייל המשאיל
                </h4>

                <div className="relative" ref={dropdownRef}>
                  <Input
                    label="טלפון"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFullName("");
                      setToken(null);
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onFocus={() => phone.length >= 3 && setShowDropdown(true)}
                    placeholder="הזן טלפון"
                    dir="ltr"
                    required
                  />
                  {showDropdown && phoneMatches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-48 overflow-auto">
                      {phoneMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 flex flex-col items-end"
                          onClick={() => selectMatch(m)}
                        >
                          <span className="font-medium">{m.name}</span>
                          <span className="text-slate-500 text-xs" dir="ltr">{m.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  label="שם מלא"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="שם מלא"
                  required
                />

                <Input
                  label="הערות"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערות (אופציונלי)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  חתימה דיגיטלית
                </label>
                <SignaturePad
                  value={signature}
                  onChange={setSignature}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                הזמנה
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
