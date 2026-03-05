"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  getApprovalListenersForUser,
  addApprovalListener,
  removeApprovalListener,
} from "@/actions/request-approval-listeners";
import { Mail, Trash2, Plus } from "lucide-react";

interface ApprovalListenersFormProps {
  userId: string;
  userEmail: string | null;
  usersList: { id: string; name: string; phone: string }[];
  departmentsList: { id: string; name: string }[];
}

export function ApprovalListenersForm({
  userId,
  userEmail,
  usersList,
  departmentsList,
}: ApprovalListenersFormProps) {
  const router = useRouter();
  const [listeners, setListeners] = useState<
    { id: string; listenToLabel: string; receiveEmail: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [listenToType, setListenToType] = useState<"user" | "department">("user");
  const [listenToUserId, setListenToUserId] = useState("");
  const [listenToDepartmentId, setListenToDepartmentId] = useState("");
  const [receiveEmail, setReceiveEmail] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const loadListeners = async () => {
    const res = await getApprovalListenersForUser(userId);
    if (res.listeners) setListeners(res.listeners);
    setLoading(false);
  };

  useEffect(() => {
    loadListeners();
  }, [userId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddLoading(true);
    try {
      const res = await addApprovalListener(
        userId,
        listenToType === "user" ? listenToUserId || null : null,
        listenToType === "department" ? listenToDepartmentId || null : null,
        receiveEmail
      );
      if (res.error) {
        setError(res.error);
      } else {
        setAddMode(false);
        setListenToUserId("");
        setListenToDepartmentId("");
        await loadListeners();
        router.refresh();
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (listenerId: string) => {
    const res = await removeApprovalListener(listenerId, userId);
    if (!res.error) {
      await loadListeners();
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        קבל מייל כשבקשות של חייל או מחלקה מאושרות. באישור באלק – מייל אחד ממוקד.
      </p>
      {!userEmail && (
        <p className="text-sm text-amber-600">
          יש להגדיר כתובת מייל למשתמש כדי לקבל התראות.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">טוען...</p>
      ) : (
        <div className="space-y-2">
          {listeners.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50"
            >
              <div className="flex items-center gap-2">
                {l.receiveEmail && <Mail className="w-4 h-4 text-emerald-600" />}
                <span className="text-sm font-medium">{l.listenToLabel}</span>
                {l.receiveEmail && (
                  <span className="text-xs text-slate-500">(מייל)</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(l.id)}
                className="text-slate-500 hover:text-red-600"
                title="הסר"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {addMode ? (
        <form onSubmit={handleAdd} className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">האזן ל</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="listenToType"
                  checked={listenToType === "user"}
                  onChange={() => setListenToType("user")}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm">חייל</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="listenToType"
                  checked={listenToType === "department"}
                  onChange={() => setListenToType("department")}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm">מחלקה</span>
              </label>
            </div>
            {listenToType === "user" ? (
              <Select
                value={listenToUserId}
                onChange={(e) => setListenToUserId(e.target.value)}
                options={[
                  { value: "", label: "בחר חייל" },
                  ...usersList.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.phone})`,
                  })),
                ]}
                placeholder="בחר חייל"
              />
            ) : (
              <Select
                value={listenToDepartmentId}
                onChange={(e) => setListenToDepartmentId(e.target.value)}
                options={[
                  { value: "", label: "בחר מחלקה" },
                  ...departmentsList.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
                placeholder="בחר מחלקה"
              />
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={receiveEmail}
              onChange={(e) => setReceiveEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span className="text-sm">קבל מייל בעת כל אישור</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={addLoading}>
              הוסף
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAddMode(false);
                setError("");
              }}
            >
              ביטול
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddMode(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף האזנה
        </Button>
      )}
    </div>
  );
}
