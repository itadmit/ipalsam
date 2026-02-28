"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteItemType } from "@/actions/inventory";

interface DeleteItemButtonProps {
  itemId: string;
  itemName: string;
}

export function DeleteItemButton({ itemId, itemName }: DeleteItemButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (step === 1) {
      if (confirmText !== "מחיקה") {
        setError('יש להקליד "מחיקה" לאימות');
        return;
      }
      setError("");
      setStep(2);
      setConfirmText("");
      return;
    }

    if (step === 2) {
      if (confirmText !== itemName) {
        setError(`יש להקליד את שם הפריט: "${itemName}"`);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const result = await deleteItemType(itemId);
        if (result.error) {
          setError(result.error);
        } else {
          setOpen(false);
          router.push("/dashboard/inventory");
          router.refresh();
        }
      } catch {
        setError("אירעה שגיאה. אנא נסה שוב");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setConfirmText("");
    setError("");
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-4 h-4" />
        מחק פריט
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              מחיקת פריט - שלב {step} מתוך 2
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium">פעולה בלתי הפיכה!</p>
                  <p className="text-sm text-red-700 mt-1">
                    מחיקת הפריט תמחק גם את כל היחידות, התנועות וההשאלות הקשורות אליו.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    כדי להמשיך, הקלד <strong>&quot;מחיקה&quot;</strong>:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='הקלד "מחיקה"'
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-800 font-medium">אימות סופי</p>
                  <p className="text-sm text-amber-700 mt-1">
                    הקלד את שם הפריט כדי לאשר את המחיקה
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    שם הפריט: <strong>{itemName}</strong>
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`הקלד "${itemName}"`}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={loading}
              disabled={
                (step === 1 && confirmText !== "מחיקה") ||
                (step === 2 && confirmText !== itemName)
              }
            >
              {step === 1 ? "המשך לשלב 2" : "מחק לצמיתות"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
