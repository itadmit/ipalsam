"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, MessageCircle, Package, ArrowLeft } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  message: string;
  holder?: string;
  holderPhone?: string;
  department: string;
  itemId?: string;
}

export function HandleAlertButton({ alert }: { alert: Alert }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      // TODO: Call server action to send reminder
      await new Promise((r) => setTimeout(r, 1000));
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (alert.type === "low_stock") {
    return (
      <Link href={`/dashboard/inventory/${alert.itemId}`}>
        <Button size="sm" variant="outline" className="shrink-0">
          <Package className="w-4 h-4" />
          צפה בפריט
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
        טפל
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>טיפול בחריג</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{alert.message}</p>
              {alert.holder && (
                <p className="text-sm text-slate-500 mt-1">
                  מחזיק: {alert.holder}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">פעולות אפשריות:</p>
              
              {alert.holderPhone && (
                <>
                  <a href={`tel:${alert.holderPhone}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="w-4 h-4" />
                      התקשר ({alert.holderPhone})
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSendReminder}
                    loading={loading}
                  >
                    <MessageCircle className="w-4 h-4" />
                    שלח תזכורת SMS
                  </Button>
                </>
              )}
              
              <Link href={`/dashboard/inventory/${alert.itemId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4" />
                  צפה בפריט
                </Button>
              </Link>

              <Link href="/dashboard/loans" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="w-4 h-4" />
                  לדף השאלות פעילות
                </Button>
              </Link>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

