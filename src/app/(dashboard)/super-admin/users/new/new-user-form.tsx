"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createUser } from "@/actions/users";

interface NewUserFormProps {
  departments: { id: string; name: string }[];
  isSuperAdmin: boolean;
}

export function NewUserForm({ departments, isSuperAdmin }: NewUserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"super_admin" | "hq_commander" | "dept_commander" | "soldier">("soldier");
  const [departmentId, setDepartmentId] = useState("");

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

    if (!phone || !firstName || !lastName) {
      setError("יש למלא את כל השדות החובה");
      return;
    }

    if (needsDepartment && !departmentId) {
      setError("יש לבחור מחלקה");
      return;
    }

    setLoading(true);

    try {
      const result = await createUser({
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

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>שים לב:</strong> סיסמת ברירת המחדל תהיה מספר הטלפון של המשתמש. 
          המשתמש יידרש לשנות את הסיסמה בהתחברות הראשונה.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="phone"
          label="מספר טלפון (שם משתמש)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0541234567"
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
          placeholder="user@example.com"
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
          צור משתמש
        </Button>
      </div>
    </form>
  );
}

