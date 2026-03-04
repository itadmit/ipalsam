"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { approveOpenRequestItem, rejectOpenRequestItem, updateOpenRequestItemStatus, markOpenRequestItemDeleted } from "@/actions/open-requests";
import { Check, X, Pencil, Send, Trash2 } from "lucide-react";

interface OpenRequestItemActionsProps {
  itemId: string;
  status: string;
  approvalNotes?: string | null;
  rejectionReason?: string | null;
}

export function OpenRequestItemActions({ itemId, status, approvalNotes, rejectionReason }: OpenRequestItemActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "edit" | "delete" | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [approvalNotesInput, setApprovalNotesInput] = useState("");
  const [editStatus, setEditStatus] = useState<"approved" | "rejected">(status === "approved" ? "approved" : "rejected");
  const [editNotes, setEditNotes] = useState(status === "approved" ? (approvalNotes || "") : (rejectionReason || ""));

  const handleOpenEdit = () => {
    setEditStatus(status === "approved" ? "approved" : "rejected");
    setEditNotes(status === "approved" ? (approvalNotes || "") : (rejectionReason || ""));
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setLoading("edit");
    try {
      const result = await updateOpenRequestItemStatus(itemId, editStatus, editNotes.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowEditDialog(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(status === "approved" ? "סמן כנמחק? (הפריט יצא ללקוח)" : "להסיר פריט נדחה מהרשימה?")) return;
    setLoading("delete");
    try {
      const result = await markOpenRequestItemDeleted(itemId);
      if (result.error) alert(result.error);
      else router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  if (status !== "pending") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">
          {status === "approved" ? "אושר" : "נדחה"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          onClick={handleOpenEdit}
          title="ערוך סטטוס והערות"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
          onClick={handleDelete}
          disabled={!!loading}
          title={status === "approved" ? "יצא ללקוח – העבר לארכיון" : "הסר מהרשימה"}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
        <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); }}>
          <DialogContent className="max-w-md p-6 pb-4">
            <DialogHeader className="!pt-0 !px-0 pb-3 border-b border-slate-200">
              <DialogTitle>עריכת סטטוס והערות</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">סטטוס</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("approved")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editStatus === "approved"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    אושר
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("rejected")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editStatus === "rejected"
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    נדחה
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-notes" className="block text-sm font-medium text-slate-700">
                  {editStatus === "approved" ? "הערות (יישלחו במייל)" : "סיבת הדחייה (תישלח במייל)"}
                </label>
                <textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={editStatus === "approved" ? "למשל: ניתן לאסוף מחר" : "למשל: אין מלאי"}
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 !pb-0 !px-3 border-t border-slate-200 gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleSaveEdit} loading={loading === "edit"}>
                <Send className="w-4 h-4" />
                שמור ושלח במייל
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const result = await approveOpenRequestItem(itemId, approvalNotesInput.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowApproveDialog(false);
        setApprovalNotesInput("");
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
      const result = await rejectOpenRequestItem(itemId, rejectReasonInput.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowRejectDialog(false);
        setRejectReasonInput("");
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

      <Dialog open={showApproveDialog} onOpenChange={(open) => { setShowApproveDialog(open); if (!open) setApprovalNotesInput(""); }}>
        <DialogContent className="max-w-md p-6 pb-4">
          <DialogHeader className="!pt-0 !px-0 pb-3 border-b border-slate-200">
            <DialogTitle className="text-emerald-700">אישור פריט</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-600 text-sm">האם אתה בטוח שברצונך לאשר פריט זה?</p>
            <div className="space-y-2">
              <label htmlFor="approval-notes" className="block text-sm font-medium text-slate-700">
                הערות (יישלחו במייל ויופיעו למבקש)
              </label>
              <textarea
                id="approval-notes"
                value={approvalNotesInput}
                onChange={(e) => setApprovalNotesInput(e.target.value)}
                placeholder="למשל: ניתן לאסוף מחר בבוקר"
                rows={3}
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 !pb-0 !px-3 border-t border-slate-200 gap-2">
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

      <Dialog open={showRejectDialog} onOpenChange={(open) => { setShowRejectDialog(open); if (!open) setRejectReasonInput(""); }}>
        <DialogContent className="max-w-md p-6 pb-4">
          <DialogHeader className="!pt-0 !px-0 pb-3 border-b border-slate-200">
            <DialogTitle className="text-red-600">דחיית פריט</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-600 text-sm">האם אתה בטוח שברצונך לדחות פריט זה?</p>
            <div className="space-y-2">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-slate-700">
                סיבת הדחייה (אופציונלי)
              </label>
              <input
                id="reject-reason"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="למשל: אין מלאי"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 !pb-0 !px-3 border-t border-slate-200 gap-2">
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
