"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { approveRequest, rejectRequest } from "@/actions/requests";

interface RequestActionsProps {
  requestId: string;
  status: string;
}

export function RequestApprovalActions({ requestId, status }: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (status !== "submitted") {
    return null;
  }

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const result = await approveRequest(requestId);
      if (result.success) {
        router.refresh();
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
      const result = await rejectRequest(requestId, rejectionReason);
      if (result.success) {
        setShowRejectDialog(false);
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
        <Button onClick={handleApprove} loading={loading === "approve"}>
          <CheckCircle className="w-4 h-4" />
          אשר
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">דחיית השאלה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              id="reason"
              label="סיבת הדחייה"
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
              דחה השאלה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

