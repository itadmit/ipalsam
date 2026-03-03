"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { approveRequest, rejectRequest, approveGroup, rejectGroup } from "@/actions/requests";

interface RequestActionsProps {
  requestId: string;
  requestGroupId?: string | null;
  groupRequestIds?: string[];
  status: string;
}

export function RequestApprovalActions({
  requestId,
  requestGroupId,
  groupRequestIds = [],
  status,
}: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (status !== "submitted") {
    return null;
  }

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const result =
        requestGroupId && groupRequestIds.length > 1
          ? await approveGroup(requestGroupId, approveNotes.trim() || undefined)
          : await approveRequest(requestId, approveNotes.trim() || undefined);
      if (result.success) {
        setShowApproveDialog(false);
        setApproveNotes("");
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setLoading("reject");
    try {
      const result =
        requestGroupId && groupRequestIds.length > 1
          ? await rejectGroup(requestGroupId, rejectionReason)
          : await rejectRequest(requestId, rejectionReason);
      if (result.success) {
        setShowRejectDialog(false);
        setRejectionReason("");
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={() => setShowRejectDialog(true)}
          loading={loading === "reject"}
        >
          <XCircle className="w-4 h-4" />
          דחה
        </Button>
        <Button onClick={() => setShowApproveDialog(true)} loading={loading === "approve"}>
          <CheckCircle className="w-4 h-4" />
          אשר
        </Button>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-700">אישור השאלה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-slate-600">האם אתה בטוח שברצונך לאשר בקשה זו?</p>
            <Input
              id="approve-notes"
              label="הערה (יישלח במייל למבקש)"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="אופציונלי – למשל: ניתן לאסוף מחר"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleApprove} loading={loading === "approve"}>
              <CheckCircle className="w-4 h-4" />
              שלח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">דחיית השאלה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-slate-600">האם אתה בטוח שברצונך לדחות בקשה זו?</p>
            <Input
              id="reason"
              label="סיבת הדחייה (חובה – יישלח במייל למבקש)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="למשל: אין מלאי זמין"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              loading={loading === "reject"}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4" />
              שלח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

