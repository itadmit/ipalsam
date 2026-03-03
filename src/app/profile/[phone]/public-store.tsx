"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PublicOpenRequestForm } from "./public-open-request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Plus, Minus, Send, User, Phone, MessageCircle } from "lucide-react";

interface ProfileData {
  name: string;
  role: string;
  phone: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
}

interface PublicStoreProps {
  storeName: string;
  department: { id: string; name: string };
  items: { id: string; name: string; departmentId: string; inStock: boolean }[];
  handoverPhone: string;
  showOpenRequestButton?: boolean;
  profile: ProfileData;
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
  showOpenRequestButton = false,
  profile,
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
    router.push(`/profile/${handoverPhone}/checkout`);
  };

  return (
    <div className="pb-24">
      <div className="max-w-lg mx-auto w-full -mt-16">
        {/* הדר פרופיל */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          {/* כיסוי */}
          <div className="relative h-48 sm:h-56 bg-slate-200 w-full overflow-hidden">
            <div
              className="absolute inset-0"
              style={
                profile.coverUrl
                  ? { backgroundImage: `url(${profile.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { backgroundImage: `url(https://www.oref.org.il/media/3pcju2vy/%D7%A4%D7%99%D7%A7%D7%95%D7%93-%D7%94%D7%A2%D7%95%D7%A8%D7%A3-%D7%9C%D7%9E%D7%A2%D7%9F-%D7%90%D7%96%D7%A8%D7%97%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C.png)`, backgroundSize: "cover", backgroundPosition: "center" }
              }
            />
            <div className="absolute inset-0 bg-black/25" aria-hidden />
          </div>
          <div className="px-4 pb-6 -mt-14 relative">
            {/* תמונה עגולה */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-lg overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-500" />
              )}
            </div>
            {/* שם, תפקיד ואייקונים באותה שורה - אייקונים משמאל, ממורכזים בגובה */}
            <div className="mt-3 flex flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
                <p className="text-slate-600 text-sm">{profile.role} • {department.name}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <a
                  href={`https://wa.me/972${handoverPhone.replace(/\D/g, "").slice(-9)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-xs font-medium">וואטסאפ</span>
                </a>
                <a
                  href={`tel:${handoverPhone}`}
                  className="flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Phone className="w-6 h-6" />
                  <span className="text-xs font-medium" dir="ltr">{profile.phone}</span>
                </a>
              </div>
            </div>
            {profile.bio && (
              <p className="mt-3 text-slate-600 text-sm">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* סקשנים מתחת להדר */}
        <div className="pt-4 px-3 space-y-4">
          {/* בקשה חדשה - אם מוגדר (כמו החנות, בעמוד הפרופיל) */}
          {showOpenRequestButton && (
            <Card className="border-slate-200 shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  בקשה חדשה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  ניתן להזמין ציוד מ־{profile.name}. הוא יקבל התראה ויצטרך לאשר ידנית.
                </p>
                <PublicOpenRequestForm
                  departmentId={department.id}
                  handoverPhone={handoverPhone}
                  storeName={storeName}
                  variant="inline"
                />
              </CardContent>
            </Card>
          )}

          {/* החנות של - אם מוגדר */}
          {items.length > 0 && (
            <Card className="border-slate-200 shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  החנות של {profile.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                      הוסף לסל
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {items.length === 0 && !showOpenRequestButton && (
            <Card className="border-slate-200 shadow">
              <CardContent className="py-8 text-center text-slate-500">
                אין תוכן להצגה
              </CardContent>
            </Card>
          )}
        </div>

        {/* פוטר */}
        <footer className="mt-8 px-4 pb-8 pt-6 border-t border-slate-200 bg-white/50 rounded-t-2xl text-center">
          <p className="text-xs text-slate-400">
            iPalsam – פותח על ידי יוגב אביטן
          </p>
        </footer>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-4">
            <div className="max-w-lg mx-auto">
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
