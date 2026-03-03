"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { approveOpenRequestItem, rejectOpenRequestItem } from "@/actions/open-requests";
import { Check, X } from "lucide-react";

interface OpenRequestItemActionsProps {
  itemId: string;
  status: string;
}

export function OpenRequestItemActions({ itemId, status }: OpenRequestItemActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (status !== "pending") {
    return (
      <span className="text-xs">
        {status === "approved" ? "אושר" : "נדחה"}
      </span>
    );
  }

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const result = await approveOpenRequestItem(itemId);
      if (result.error) alert(result.error);
      else {
        setShowApproveDialog(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      const result = await rejectOpenRequestItem(itemId, rejectionReason.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowRejectDialog(false);
        setRejectionReason("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          onClick={() => setShowApproveDialog(true)}
          disabled={!!loading}
        >
          <Check className="w-3.5 h-3.5" />
          אישור
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-red-700 border-red-300 hover:bg-red-50"
          onClick={() => setShowRejectDialog(true)}
          disabled={!!loading}
        >
          <X className="w-3.5 h-3.5" />
          דחייה
        </Button>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-700">אישור פריט</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">האם אתה בטוח שברצונך לאשר פריט זה?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleApprove} loading={loading === "approve"}>
              <Check className="w-4 h-4" />
              אשר
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={(open) => { setShowRejectDialog(open); if (!open) setRejectionReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">דחיית פריט</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-slate-600">האם אתה בטוח שברצונך לדחות פריט זה?</p>
            <div>
              <label htmlFor="reject-reason" className="block text-sm font-medium text-slate-700 mb-1.5">
                סיבת הדחייה (אופציונלי)
              </label>
              <input
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="למשל: אין מלאי"
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              loading={loading === "reject"}
            >
              <X className="w-4 h-4" />
              דחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
