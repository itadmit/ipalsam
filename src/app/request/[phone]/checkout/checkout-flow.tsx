"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Card, CardContent } from "@/components/ui/card";
import {
  identifyOrCreateSoldier,
  identifySoldierByBarcode,
  createRequestBySoldier,
  getSoldierRequestData,
} from "@/actions/soldier-request";
import Link from "next/link";
import { Phone, ScanBarcode, User, Package, Plus, Trash2, ArrowRight } from "lucide-react";

interface CheckoutFlowProps {
  handoverPhone: string;
  storeName: string;
  department: { id: string; name: string };
}

type Step = "identify" | "create" | "form";

interface CartItem {
  departmentId: string;
  itemTypeId: string;
  quantity: number;
}

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CheckoutFlow({
  handoverPhone,
  storeName,
  department,
}: CheckoutFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [token, setToken] = useState<string | null>(null);
  const [soldier, setSoldier] = useState<{ name: string; phone: string } | null>(null);
  const [itemsByDepartment, setItemsByDepartment] = useState<
    Record<string, { id: string; name: string; inStock: boolean }[]>
  >({ [department.id]: [] });

  const [phone, setPhone] = useState("");
  const [barcode, setBarcode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  const [rows, setRows] = useState<
    { id: string; departmentId: string; itemTypeId: string; quantity: number }[]
  >([]);
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
          id: generateRowId(),
          departmentId: c.departmentId,
          itemTypeId: c.itemTypeId,
          quantity: c.quantity,
        }))
      );
    } catch {
      router.replace(`/request/${handoverPhone}`);
    }
  }, [handoverPhone, router]);

  const handleIdentifyByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await identifyOrCreateSoldier(phone);
      if ("error" in result) {
        setError(result.error || "");
      } else if ("needCreate" in result) {
        setStep("create");
      } else if ("token" in result && result.token) {
        setToken(result.token);
        setSoldier({ name: result.soldierName, phone });
        const data = await getSoldierRequestData(result.token, handoverPhone);
        if (!("error" in data)) {
          setItemsByDepartment(data.itemsByDepartment);
          setRecipientName(data.soldier.name);
          setRecipientPhone(data.soldier.phone);
          setStep("form");
        }
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifyByBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await identifySoldierByBarcode(barcode);
      if ("error" in result) {
        setError(result.error || "");
      } else if (result.token) {
        setToken(result.token);
        setSoldier({ name: result.soldierName, phone: "" });
        const data = await getSoldierRequestData(result.token, handoverPhone);
        if (!("error" in data)) {
          setItemsByDepartment(data.itemsByDepartment);
          setRecipientName(data.soldier.name);
          setRecipientPhone(data.soldier.phone);
          setStep("form");
        } else {
          setError(data.error || "שגיאה");
        }
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("יש להזין שם מלא");
      return;
    }
    setLoading(true);
    try {
      const result = await identifyOrCreateSoldier(phone, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        departmentId: department.id,
      });
      if ("error" in result) {
        setError(result.error || "");
      } else if ("token" in result && result.token) {
        setToken(result.token);
        setSoldier({ name: `${firstName} ${lastName}`, phone });
        const data = await getSoldierRequestData(result.token, handoverPhone);
        if (!("error" in data)) {
          setItemsByDepartment(data.itemsByDepartment);
          setRecipientName(data.soldier.name);
          setRecipientPhone(data.soldier.phone);
          setStep("form");
        } else {
          setError(data.error || "שגיאה");
        }
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) return;

    const validRows = rows.filter((r) => r.departmentId && r.itemTypeId && r.quantity > 0);
    if (validRows.length === 0) {
      setError("יש להוסיף לפחות פריט אחד");
      return;
    }
    if (!recipientName.trim()) {
      setError("יש להזין שם");
      return;
    }
    if (!recipientSignature) {
      setError("יש לחתום חתימה דיגיטלית");
      return;
    }

    setLoading(true);
    try {
      const result = await createRequestBySoldier(token, validRows, {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        recipientSignature,
        notes: notes.trim() || undefined,
      }, handoverPhone);

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

  const allItems = Object.entries(itemsByDepartment).flatMap(([deptId, items]) =>
    items.map((i) => ({ ...i, departmentId: deptId }))
  );

  const departments = [{ id: department.id, name: department.name }];

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: generateRowId(), departmentId: department.id, itemTypeId: "", quantity: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [field]: value };
        if (field === "departmentId") next.itemTypeId = "";
        return next;
      })
    );
  };

  const getItemLabel = (item: { id: string; name: string; inStock: boolean }, excludeRowId?: string) => {
    const requestedInForm = rows
      .filter((r) => r.itemTypeId === item.id && r.id !== excludeRowId)
      .reduce((sum, r) => sum + r.quantity, 0);
    const suffix = !item.inStock ? " — אזל המלאי" : "";
    return `${item.name}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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

            {step === "identify" && (
              <div className="space-y-6">
                <p className="text-slate-600">הזן טלפון או סרוק ברקוד לזיהוי</p>
                <form onSubmit={handleIdentifyByPhone} className="space-y-3">
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
                  <Button type="submit" className="w-full" loading={loading}>
                    המשך
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
                <form onSubmit={handleIdentifyByBarcode} className="space-y-3">
                  <div className="relative">
                    <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="סרוק ברקוד"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" loading={loading}>
                    זיהוי ברקוד
                  </Button>
                </form>
                <p className="text-xs text-slate-500">
                  לא רשום? הזן טלפון ולחץ המשך – תוכל להירשם בשלב הבא
                </p>
              </div>
            )}

            {step === "create" && (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <p className="text-slate-600">מידע חדש – ניצור עבורך חשבון</p>
                <Input
                  label="מספר טלפון"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="שם פרטי"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="שם משפחה"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  המשך
                </Button>
              </form>
            )}

            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    פרטי החייל
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="שם"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                    <Input
                      label="טלפון"
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <Input
                    label="הערות"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הערות (אופציונלי)"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      פריטים בהשאלה
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      הוסף
                    </Button>
                  </div>
                  {rows.map((row) => {
                    const availableItems = itemsByDepartment[row.departmentId] || [];
                    const selectedItem = allItems.find((i) => i.id === row.itemTypeId);
                    return (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
                      >
                        <div className="flex-1 min-w-[140px]">
                          <Select
                            label="מחלקה"
                            value={row.departmentId}
                            onChange={(e) => updateRow(row.id, "departmentId", e.target.value)}
                            options={departments.map((d) => ({ value: d.id, label: d.name }))}
                            placeholder="בחר מחלקה"
                          />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <Select
                            label="פריט"
                            value={row.itemTypeId}
                            onChange={(e) => updateRow(row.id, "itemTypeId", e.target.value)}
                            options={availableItems.map((i) => ({
                              value: i.id,
                              label: getItemLabel(i, row.id),
                            }))}
                            placeholder={row.departmentId ? "בחר פריט" : "בחר מחלקה קודם"}
                            disabled={!row.departmentId}
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            label="כמות"
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) =>
                              updateRow(row.id, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className="shrink-0 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">חתימה דיגיטלית</label>
                  <SignaturePad
                    value={recipientSignature}
                    onChange={setRecipientSignature}
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  שלח השאלה
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
