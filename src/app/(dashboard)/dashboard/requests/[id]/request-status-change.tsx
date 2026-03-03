"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { getStatusLabel } from "@/lib/utils";
import {
  approveRequest,
  rejectRequest,
  approveGroup,
  rejectGroup,
  returnGroup,
  updateRequestStatusToClosed,
  updateRequestStatus,
} from "@/actions/requests";

const ALL_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "ready_for_pickup",
  "handed_over",
  "returned",
  "closed",
  "overdue",
];

function getAllStatusOptions(current: string): { value: string; label: string }[] {
  return ALL_STATUSES.filter((s) => s !== current).map((value) => ({
    value,
    label: value === "returned" ? "הוחזר" : getStatusLabel(value),
  }));
}

interface RequestStatusChangeProps {
  requestId: string;
  requestGroupId: string | null;
  groupRequestIds: string[];
  status: string;
  canApprove: boolean;
}

export function RequestStatusChange({
  requestId,
  requestGroupId,
  groupRequestIds,
  status,
  canApprove,
}: RequestStatusChangeProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const statusOptions = getAllStatusOptions(status);
  const hasOptions = statusOptions.length > 0 && canApprove;
  const canMarkReturned =
    canApprove && (status === "handed_over" || status === "approved");

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    if (newStatus === "approved") {
      setPendingStatus("approved");
      setShowApproveDialog(true);
      return;
    }
    if (newStatus === "rejected") {
      setPendingStatus("rejected");
      setShowRejectDialog(true);
      return;
    }
    setLoading(true);
    try {
      let result: { success?: boolean; error?: string } = {};

      if (newStatus === "returned") {
        const groupKey = requestGroupId ?? requestId;
        result = await returnGroup(groupKey);
      } else if (newStatus === "closed" || newStatus === "overdue") {
        result = await updateRequestStatusToClosed(
          requestId,
          requestGroupId,
          newStatus as "closed" | "overdue"
        );
      } else {
        result = await updateRequestStatus(requestId, requestGroupId, newStatus);
      }

      if (result.success) {
        setExpanded(false);
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    const groupKey = requestGroupId ?? requestId;
    setLoading(true);
    try {
      const result = await returnGroup(groupKey);
      if (result.success) router.refresh();
      else if (result.error) alert(result.error);
    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result =
        requestGroupId && groupRequestIds.length > 1
          ? await approveGroup(requestGroupId, approveNotes.trim() || undefined)
          : await approveRequest(requestId, approveNotes.trim() || undefined);
      if (result.success) {
        setShowApproveDialog(false);
        setApproveNotes("");
        setPendingStatus(null);
        setExpanded(false);
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (e) {
      console.error(e);
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setLoading(true);
    try {
      const result =
        requestGroupId && groupRequestIds.length > 1
          ? await rejectGroup(requestGroupId, rejectionReason, rejectNotes.trim() || undefined)
          : await rejectRequest(requestId, rejectionReason, rejectNotes.trim() || undefined);
      if (result.success) {
        setShowRejectDialog(false);
        setRejectionReason("");
        setRejectNotes("");
        setPendingStatus(null);
        setExpanded(false);
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!canApprove) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {canMarkReturned && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={handleMarkReturned}
            disabled={loading}
          >
            <RotateCcw className="w-4 h-4" />
            הוחזר
          </Button>
        )}
        <button
          type="button"
          onClick={() => hasOptions && setExpanded((e) => !e)}
          className={`flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors ${
            hasOptions ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {hasOptions ? (
            expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )
          ) : null}
          <span>{hasOptions ? (expanded ? "סגור" : "שינוי סטטוס") : ""}</span>
        </button>

        {expanded && hasOptions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
            <Select
              label="בחר סטטוס חדש"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) handleStatusChange(v);
              }}
              options={statusOptions}
              placeholder="בחר סטטוס..."
              disabled={loading}
            />
          </div>
        )}
      </div>

      <Dialog open={showApproveDialog} onOpenChange={(open) => { setShowApproveDialog(open); if (!open) setPendingStatus(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-700">אישור השאלה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              id="approve-notes"
              label="הערות (יישלחו במייל למבקש)"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="אופציונלי – למשל: ניתן לאסוף מחר"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleApprove} loading={loading}>
              אשר השאלה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={(open) => { setShowRejectDialog(open); if (!open) setPendingStatus(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">דחיית השאלה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              id="reason"
              label="סיבת הדחייה"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="למשל: אין מלאי זמין"
              required
            />
            <Input
              id="reject-notes"
              label="הערות נוספות (יישלחו במייל למבקש)"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="אופציונלי"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              loading={loading}
              disabled={!rejectionReason.trim()}
            >
              דחה השאלה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
