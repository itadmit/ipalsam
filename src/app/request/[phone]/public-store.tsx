"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Plus, Minus } from "lucide-react";

interface PublicStoreProps {
  storeName: string;
  department: { id: string; name: string };
  items: { id: string; name: string; departmentId: string; inStock: boolean }[];
  handoverPhone: string;
}

interface CartItem {
  itemTypeId: string;
  departmentId: string;
  name: string;
  quantity: number;
}

export function PublicStore({
  storeName,
  department,
  items,
  handoverPhone,
}: PublicStoreProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartTotal = cart.reduce((sum, c) => sum + c.quantity, 0);

  const addToCart = (item: { id: string; name: string; departmentId: string; inStock: boolean }) => {
    if (!item.inStock) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.itemTypeId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.itemTypeId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { itemTypeId: item.id, departmentId: item.departmentId, name: item.name, quantity: 1 }];
    });
  };

  const removeFromCart = (itemTypeId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemTypeId === itemTypeId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((c) => c.itemTypeId !== itemTypeId);
      return prev.map((c) =>
        c.itemTypeId === itemTypeId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  const goToCheckout = () => {
    if (cart.length === 0) return;
    const cartData = cart.map((c) => ({
      departmentId: c.departmentId,
      itemTypeId: c.itemTypeId,
      quantity: c.quantity,
    }));
    sessionStorage.setItem("request-cart", JSON.stringify(cartData));
    sessionStorage.setItem("request-from", handoverPhone);
    router.push(`/request/${handoverPhone}/checkout`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{storeName}</h1>
          <p className="text-slate-500 mt-1">{department.name}</p>
        </div>

        <Card className="mb-6 border-slate-200 shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              פריטים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50/50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className={item.inStock ? "text-sm text-emerald-600" : "text-sm text-slate-400"}>
                      {item.inStock ? "במלאי" : "אזל המלאי"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCart(item)}
                    disabled={!item.inStock}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">סל ({cartTotal} פריטים)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cart.map((c) => (
                    <div
                      key={c.itemTypeId}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-sm"
                    >
                      <span className="truncate max-w-[100px]">{c.name}</span>
                      <span className="font-medium">×{c.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.itemTypeId)}
                        className="p-0.5 rounded hover:bg-slate-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={goToCheckout}>
                צ׳ק אוט – מילוי פרטים והשאלה
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
