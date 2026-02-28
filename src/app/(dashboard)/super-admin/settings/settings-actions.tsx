"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Shield, Clock, Database, Save, AlertTriangle, Trash2 } from "lucide-react";
import { resetSystem } from "@/actions/system";
import {
  saveGeneralSettings,
  saveNotificationSettings,
  saveSecuritySettings,
  saveLoanSettings,
} from "@/actions/settings";

export function GeneralSettingsForm({
  initialBaseName,
  initialSystemEmail,
}: {
  initialBaseName: string;
  initialSystemEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseName, setBaseName] = useState(initialBaseName);
  const [systemEmail, setSystemEmail] = useState(initialSystemEmail);

  useEffect(() => {
    setBaseName(initialBaseName);
    setSystemEmail(initialSystemEmail);
  }, [initialBaseName, initialSystemEmail]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await saveGeneralSettings(baseName, systemEmail);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          הגדרות כלליות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <Input
          id="baseName"
          label="שם הבסיס"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
        />
        <Input
          id="systemEmail"
          label="אימייל מערכת (לשליחת התראות)"
          type="email"
          value={systemEmail}
          onChange={(e) => setSystemEmail(e.target.value)}
          dir="ltr"
        />
        <Button onClick={handleSave} loading={loading}>
          <Save className="w-4 h-4" />
          שמור שינויים
        </Button>
      </CardContent>
    </Card>
  );
}

export function NotificationSettingsForm({
  initialOverdue,
  initialLowStock,
  initialNewRequest,
}: {
  initialOverdue: boolean;
  initialLowStock: boolean;
  initialNewRequest: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overdueNotifications, setOverdueNotifications] = useState(initialOverdue);
  const [lowStockNotifications, setLowStockNotifications] = useState(initialLowStock);
  const [newRequestNotifications, setNewRequestNotifications] = useState(initialNewRequest);

  useEffect(() => {
    setOverdueNotifications(initialOverdue);
    setLowStockNotifications(initialLowStock);
    setNewRequestNotifications(initialNewRequest);
  }, [initialOverdue, initialLowStock, initialNewRequest]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await saveNotificationSettings(
        overdueNotifications,
        lowStockNotifications,
        newRequestNotifications
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          הגדרות התראות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">התראות איחור</p>
            <p className="text-sm text-slate-500">שלח התראה כשפריט באיחור</p>
          </div>
          <input
            type="checkbox"
            checked={overdueNotifications}
            onChange={(e) => setOverdueNotifications(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">התראות מלאי נמוך</p>
            <p className="text-sm text-slate-500">שלח התראה כשמלאי יורד מתחת למינימום</p>
          </div>
          <input
            type="checkbox"
            checked={lowStockNotifications}
            onChange={(e) => setLowStockNotifications(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">התראות בקשות חדשות</p>
            <p className="text-sm text-slate-500">שלח התראה למפקד מחלקה על בקשה חדשה</p>
          </div>
          <input
            type="checkbox"
            checked={newRequestNotifications}
            onChange={(e) => setNewRequestNotifications(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>
        <Button onClick={handleSave} loading={loading}>
          <Save className="w-4 h-4" />
          שמור שינויים
        </Button>
      </CardContent>
    </Card>
  );
}

export function SecuritySettingsForm({
  initialSessionTimeout,
  initialForcePasswordChange,
}: {
  initialSessionTimeout: string;
  initialForcePasswordChange: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState(initialSessionTimeout);
  const [forcePasswordChange, setForcePasswordChange] = useState(initialForcePasswordChange);

  useEffect(() => {
    setSessionTimeout(initialSessionTimeout);
    setForcePasswordChange(initialForcePasswordChange);
  }, [initialSessionTimeout, initialForcePasswordChange]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await saveSecuritySettings(sessionTimeout, forcePasswordChange);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          אבטחה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <Input
          id="sessionTimeout"
          label="זמן פקיעת סשן (שעות)"
          type="number"
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(e.target.value)}
          min={1}
          max={72}
        />
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">חובת שינוי סיסמה</p>
            <p className="text-sm text-slate-500">משתמשים חדשים חייבים לשנות סיסמה</p>
          </div>
          <input
            type="checkbox"
            checked={forcePasswordChange}
            onChange={(e) => setForcePasswordChange(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
        </div>
        <Button onClick={handleSave} loading={loading}>
          <Save className="w-4 h-4" />
          שמור שינויים
        </Button>
      </CardContent>
    </Card>
  );
}

export function LoanSettingsForm({
  initialDefaultLoanDays,
  initialOverdueDays,
}: {
  initialDefaultLoanDays: string;
  initialOverdueDays: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaultLoanDays, setDefaultLoanDays] = useState(initialDefaultLoanDays);
  const [overdueDays, setOverdueDays] = useState(initialOverdueDays);

  useEffect(() => {
    setDefaultLoanDays(initialDefaultLoanDays);
    setOverdueDays(initialOverdueDays);
  }, [initialDefaultLoanDays, initialOverdueDays]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await saveLoanSettings(defaultLoanDays, overdueDays);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          הגדרות השאלה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <Input
          id="defaultLoanDays"
          label="ימי השאלה ברירת מחדל"
          type="number"
          value={defaultLoanDays}
          onChange={(e) => setDefaultLoanDays(e.target.value)}
          min={1}
          max={365}
        />
        <Input
          id="overdueDays"
          label="ימים עד סימון כ'באיחור'"
          type="number"
          value={overdueDays}
          onChange={(e) => setOverdueDays(e.target.value)}
          min={0}
          max={30}
        />
        <Button onClick={handleSave} loading={loading}>
          <Save className="w-4 h-4" />
          שמור שינויים
        </Button>
      </CardContent>
    </Card>
  );
}

export function DatabaseActions() {
  const router = useRouter();
  const [backupLoading, setBackupLoading] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      // TODO: Call server action to create backup
      await new Promise((r) => setTimeout(r, 2000));
      
      // Simulate backup download
      const backupData = JSON.stringify({ backup: true, date: new Date().toISOString() });
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (confirmText !== "מחיקה") return;
    setCleanupLoading(true);
    try {
      // TODO: Call server action to cleanup old data
      await new Promise((r) => setTimeout(r, 2000));
      setShowCleanupDialog(false);
      setConfirmText("");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          מסד נתונים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">מסד הנתונים מחובר ופעיל</p>
          <p className="text-sm text-green-600">Neon PostgreSQL</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackup} loading={backupLoading}>
            גיבוי ידני
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowCleanupDialog(true)}
          >
            ניקוי נתונים ישנים
          </Button>
        </div>
      </CardContent>

      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">ניקוי נתונים ישנים</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">פעולה מסוכנת!</p>
              </div>
              <p className="text-sm text-red-700">
                פעולה זו תמחק נתונים ישנים (מעל שנה) ממסד הנתונים. הנתונים לא יהיו ניתנים לשחזור.
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">
                כדי לאשר, הקלד <strong>&quot;מחיקה&quot;</strong>:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='הקלד "מחיקה"'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleCleanup}
              loading={cleanupLoading}
              disabled={confirmText !== "מחיקה"}
            >
              מחק נתונים ישנים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function SystemResetAction() {
  const router = useRouter();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState("");

  const handleReset = async () => {
    if (step === 1) {
      if (confirmText !== "אני מאשר מחיקה") {
        setError("טקסט אימות שגוי");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (phoneConfirm !== "0542284283") {
        setError("מספר טלפון שגוי");
        return;
      }

      setLoading(true);
      setError("");
      
      try {
        const result = await resetSystem(confirmText, phoneConfirm);
        
        if (result.error) {
          setError(result.error);
          return;
        }

        // Success - redirect to login
        setShowResetDialog(false);
        router.push("/login");
      } catch (err) {
        setError("שגיאה באיפוס המערכת");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setShowResetDialog(false);
    setStep(1);
    setConfirmText("");
    setPhoneConfirm("");
    setError("");
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            איפוס מערכת
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <p className="text-red-800 font-medium mb-2">⚠️ אזהרה חמורה!</p>
            <p className="text-sm text-red-700">
              פעולה זו תמחק את כל הנתונים במערכת ותיצור מחדש רק את:
            </p>
            <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
              <li>מחלקת מפקדה</li>
              <li>משתמש סופר אדמין: יוגב אביטן (0542284283)</li>
              <li>משתמש מפקד מפקדה: ניסם חדד (0527320191)</li>
            </ul>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            איפוס מערכת
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              איפוס מערכת - שלב {step} מתוך 2
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">פעולה בלתי הפיכה!</p>
                  </div>
                  <p className="text-sm text-red-700">
                    כל הנתונים יימחקו לצמיתות: משתמשים, מחלקות, ציוד, בקשות, תנועות, חתימות.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    כדי להמשיך, הקלד <strong>&quot;אני מאשר מחיקה&quot;</strong>:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='הקלד "אני מאשר מחיקה"'
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-800 font-medium">אימות כפול נדרש</p>
                  <p className="text-sm text-amber-700">
                    הזן את מספר הטלפון של סופר אדמין לאימות סופי
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    מספר טלפון סופר אדמין:
                  </p>
                  <Input
                    value={phoneConfirm}
                    onChange={(e) => setPhoneConfirm(e.target.value)}
                    placeholder="0542284283"
                    dir="ltr"
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
              onClick={handleReset}
              loading={loading}
              disabled={
                (step === 1 && confirmText !== "אני מאשר מחיקה") ||
                (step === 2 && phoneConfirm !== "0542284283")
              }
            >
              {step === 1 ? "המשך לשלב 2" : "אפס מערכת"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
