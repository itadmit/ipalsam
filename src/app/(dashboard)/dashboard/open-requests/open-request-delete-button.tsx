"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteOpenRequest } from "@/actions/open-requests";

interface OpenRequestDeleteButtonProps {
  requestId: string;
}

export function OpenRequestDeleteButton({ requestId }: OpenRequestDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteOpenRequest(requestId);
      if (result.error) {
        alert(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      alert("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
        onClick={() => setOpen(true)}
        title="מחק בקשה"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="!pt-0 pb-3 border-b border-slate-200">
            <DialogTitle className="text-red-600">מחיקת בקשה</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 text-sm pt-4">
            האם אתה בטוח שברצונך למחוק בקשה זו? פעולה זו אינה ניתנת לביטול.
          </p>
          <DialogFooter className="pt-4 border-t border-slate-200 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={loading}>
              <Trash2 className="w-4 h-4" />
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
