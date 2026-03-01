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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const statusOptions = getAllStatusOptions(status);
  const hasOptions = statusOptions.length > 0 && canApprove;
  const canMarkReturned =
    canApprove && (status === "handed_over" || status === "approved");

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setLoading(true);
    try {
      let result: { success?: boolean; error?: string } = {};

      if (newStatus === "approved") {
        result =
          requestGroupId && groupRequestIds.length > 1
            ? await approveGroup(requestGroupId)
            : await approveRequest(requestId);
      } else if (newStatus === "rejected") {
        setShowRejectDialog(true);
        setLoading(false);
        return;
      } else if (newStatus === "returned") {
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

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setLoading(true);
    try {
      const result =
        requestGroupId && groupRequestIds.length > 1
          ? await rejectGroup(requestGroupId, rejectionReason)
          : await rejectRequest(requestId, rejectionReason);
      if (result.success) {
        setShowRejectDialog(false);
        setRejectionReason("");
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
