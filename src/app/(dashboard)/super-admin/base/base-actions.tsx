"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface BaseActionsProps {
  baseId: string;
  hasActivePeriod: boolean;
  periodName?: string;
}

export function BaseActions({ baseId, hasActivePeriod, periodName }: BaseActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEndPeriodDialog, setShowEndPeriodDialog] = useState(false);
  const [showFoldingDialog, setShowFoldingDialog] = useState(false);
  const [showNewPeriodDialog, setShowNewPeriodDialog] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleEndPeriod = async () => {
    setLoading(true);
    try {
      // TODO: Call server action
      // await endPeriod(baseId);
      await new Promise((r) => setTimeout(r, 1000));
      setShowEndPeriodDialog(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFolding = async () => {
    if (confirmText !== "קיפול") return;
    setLoading(true);
    try {
      // TODO: Call server action
      // await startBaseFolding(baseId);
      await new Promise((r) => setTimeout(r, 1000));
      setShowFoldingDialog(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPeriod = async () => {
    if (!newPeriodName.trim()) return;
    setLoading(true);
    try {
      // TODO: Call server action
      // await createPeriod(baseId, newPeriodName);
      await new Promise((r) => setTimeout(r, 1000));
      setShowNewPeriodDialog(false);
      setNewPeriodName("");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasActivePeriod) {
    return (
      <>
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">אין תקופה פעילה</p>
          <Button onClick={() => setShowNewPeriodDialog(true)}>
            <Play className="w-4 h-4" />
            פתח תקופה חדשה
          </Button>
        </div>

        <Dialog open={showNewPeriodDialog} onOpenChange={setShowNewPeriodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>פתיחת תקופה חדשה</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                id="periodName"
                label="שם התקופה"
                placeholder="למשל: תעסוקה פברואר 2026"
                value={newPeriodName}
                onChange={(e) => setNewPeriodName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPeriodDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleNewPeriod} loading={loading} disabled={!newPeriodName.trim()}>
                פתח תקופה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setShowEndPeriodDialog(true)}>
          <Pause className="w-4 h-4" />
          סיים תקופה
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-amber-600 hover:bg-amber-50"
          onClick={() => setShowFoldingDialog(true)}
        >
          <AlertTriangle className="w-4 h-4" />
          התחל קיפול בסיס
        </Button>
      </div>

      {/* End Period Dialog */}
      <Dialog open={showEndPeriodDialog} onOpenChange={setShowEndPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>סיום תקופה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              האם אתה בטוח שברצונך לסיים את התקופה <strong>{periodName}</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              פעולה זו תיצור Snapshot סגירה ותסיים את התקופה הנוכחית.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndPeriodDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleEndPeriod} loading={loading}>
              <CheckCircle className="w-4 h-4" />
              סיים תקופה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Folding Dialog */}
      <Dialog open={showFoldingDialog} onOpenChange={setShowFoldingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600">התחלת קיפול בסיס</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-800 font-medium">⚠️ פעולה זו היא בלתי הפיכה!</p>
              <p className="text-sm text-amber-700 mt-1">
                קיפול הבסיס יעבור את כל המערכת למצב סגירה. יש לוודא שכל הציוד הוחזר.
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">
                כדי לאשר, הקלד <strong>&quot;קיפול&quot;</strong>:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='הקלד "קיפול"'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFoldingDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleStartFolding}
              loading={loading}
              disabled={confirmText !== "קיפול"}
            >
              <AlertTriangle className="w-4 h-4" />
              התחל קיפול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PeriodActions({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      // TODO: Call server action based on action type
      await new Promise((r) => setTimeout(r, 1000));
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => handleAction("openSnapshot")}
        loading={loading === "openSnapshot"}
      >
        <CheckCircle className="w-4 h-4" />
        צור Snapshot פתיחה
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => handleAction("closeSnapshot")}
        loading={loading === "closeSnapshot"}
      >
        <CheckCircle className="w-4 h-4" />
        צור Snapshot סגירה
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => handleAction("exceptionsReport")}
        loading={loading === "exceptionsReport"}
      >
        <AlertTriangle className="w-4 h-4" />
        דוח חריגים (מי מחזיק מה)
      </Button>
    </div>
  );
}

