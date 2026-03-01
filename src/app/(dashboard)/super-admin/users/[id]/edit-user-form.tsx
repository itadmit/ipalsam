"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateUser } from "@/actions/users";

interface EditUserFormProps {
  user: {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    email: string | null;
    role: "super_admin" | "hq_commander" | "dept_commander" | "soldier";
    departmentId: string | null;
    barcode?: string;
    soldierDepartmentIds?: string[];
  };
  departments: { id: string; name: string }[];
  isSuperAdmin: boolean;
}

export function EditUserForm({ user, departments, isSuperAdmin }: EditUserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState(user.phone);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role);
  const [departmentId, setDepartmentId] = useState(user.departmentId || "");
  const [barcode, setBarcode] = useState(user.barcode || "");
  const [soldierDepartmentIds, setSoldierDepartmentIds] = useState<string[]>(
    user.soldierDepartmentIds || []
  );

  const roleOptions = [
    { value: "soldier", label: "חייל" },
    { value: "dept_commander", label: "מפקד מחלקה" },
    { value: "hq_commander", label: "מפקד מפקדה" },
    ...(isSuperAdmin ? [{ value: "super_admin", label: "סופר אדמין" }] : []),
  ];

  const needsDepartment = role === "dept_commander" || role === "soldier";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateUser(user.id, {
        phone,
        firstName,
        lastName,
        email: email || undefined,
        role,
        departmentId: needsDepartment ? departmentId : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/users");
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          id="phone"
          label="מספר טלפון (שם משתמש)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="שם פרטי"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            id="lastName"
            label="שם משפחה"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          id="email"
          label="אימייל (אופציונלי)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
        />

        <Select
          id="role"
          label="תפקיד"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          options={roleOptions}
          required
        />

        {needsDepartment && (
          <Select
            id="department"
            label="מחלקה"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="בחר מחלקה"
            required
          />
        )}

        {role === "soldier" && (
          <>
            <Input
              id="barcode"
              label="ברקוד (השאלה מהירה)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="קוד ברקוד"
              dir="ltr"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                מחלקות להשאלה מהירה (צ׳קבוקס)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                בחר מאילו מחלקות החייל יכול לבקש בהשאלה מהירה. אם ריק - משתמש במחלקה שלו.
              </p>
              <div className="flex flex-wrap gap-3">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soldierDepartmentIds.includes(d.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSoldierDepartmentIds((prev) => [...prev, d.id]);
                        } else {
                          setSoldierDepartmentIds((prev) => prev.filter((r) => r !== d.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          ביטול
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          שמור שינויים
        </Button>
      </div>
    </form>
  );
}

