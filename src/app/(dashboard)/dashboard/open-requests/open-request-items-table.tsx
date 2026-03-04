"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { approveOpenRequestItemsBulk, rejectOpenRequestItemsBulk } from "@/actions/open-requests";
import { OpenRequestItemActions } from "./open-request-item-actions";
import { Check, X } from "lucide-react";

interface Item {
  id: string;
  itemName: string;
  quantity: number;
  notes: string | null;
  status: string;
  approvalNotes: string | null;
  rejectionReason: string | null;
}

interface OpenRequestItemsTableProps {
  items: Item[];
}

export function OpenRequestItemsTable({ items }: OpenRequestItemsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const pendingItems = items.filter((i) => i.status === "pending");
  const allPendingSelected = pendingItems.length > 0 && pendingItems.every((i) => selected.has(i.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingItems.map((i) => i.id)));
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setLoading("approve");
    try {
      const result = await approveOpenRequestItemsBulk(ids, approvalNotes.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowApproveDialog(false);
        setApprovalNotes("");
        setSelected(new Set());
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setLoading("reject");
    try {
      const result = await rejectOpenRequestItemsBulk(ids, rejectReason.trim() || undefined);
      if (result.error) alert(result.error);
      else {
        setShowRejectDialog(false);
        setRejectReason("");
        setSelected(new Set());
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const selectedCount = selected.size;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {pendingItems.length > 0 && (
                <th className="text-right py-2 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
              )}
              <th className="text-right py-2 px-3 font-medium">שם הפריט</th>
              <th className="text-right py-2 px-3 font-medium">כמות</th>
              <th className="text-right py-2 px-3 font-medium">הערות</th>
              <th className="text-right py-2 px-3 font-medium w-32">פעולה</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                {pendingItems.length > 0 && (
                  <td className="py-2 px-3">
                    {item.status === "pending" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="w-4 inline-block" />
                    )}
                  </td>
                )}
                <td className="py-2 px-3">{item.itemName}</td>
                <td className="py-2 px-3">{item.quantity}</td>
                <td className="py-2 px-3 text-slate-500">{item.notes || "-"}</td>
                <td className="py-2 px-3">
                  <OpenRequestItemActions
                    itemId={item.id}
                    status={item.status}
                    approvalNotes={item.approvalNotes}
                    rejectionReason={item.rejectionReason}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCount > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600">נבחרו {selectedCount} פריטים</span>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={() => setShowApproveDialog(true)}
          >
            <Check className="w-4 h-4" />
            אשר נבחרים
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-red-700 border-red-300 hover:bg-red-50"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="w-4 h-4" />
            דחה נבחרים
          </Button>
        </div>
      )}

      <Dialog open={showApproveDialog} onOpenChange={(o) => { setShowApproveDialog(o); if (!o) setApprovalNotes(""); }}>
        <DialogContent className="max-w-md p-6 pb-4">
          <DialogHeader className="!pt-0 !px-0 pb-3 border-b border-slate-200">
            <DialogTitle className="text-emerald-700">אישור {selectedCount} פריטים</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-600 text-sm">הערות שיישלחו למבקש (אופציונלי):</p>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="למשל: ניתן לאסוף מחר בבוקר"
              rows={3}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>
          <DialogFooter className="pt-4 !pb-0 !px-3 border-t border-slate-200 gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleBulkApprove} loading={loading === "approve"}>
              <Check className="w-4 h-4" />
              אשר {selectedCount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={(o) => { setShowRejectDialog(o); if (!o) setRejectReason(""); }}>
        <DialogContent className="max-w-md p-6 pb-4">
          <DialogHeader className="!pt-0 !px-0 pb-3 border-b border-slate-200">
            <DialogTitle className="text-red-600">דחיית {selectedCount} פריטים</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-600 text-sm">סיבת הדחייה (אופציונלי):</p>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="למשל: אין מלאי"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <DialogFooter className="pt-4 !pb-0 !px-3 border-t border-slate-200 gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
              loading={loading === "reject"}
            >
              <X className="w-4 h-4" />
              דחה {selectedCount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
