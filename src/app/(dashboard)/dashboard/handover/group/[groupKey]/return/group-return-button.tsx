"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { returnGroup } from "@/actions/requests";
import { CheckCircle } from "lucide-react";

export function GroupReturnButton({ groupKey }: { groupKey: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReturn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await returnGroup(groupKey);

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/loans");
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="p-4">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <Button
          onClick={handleReturn}
          loading={loading}
          className="w-full"
          size="lg"
        >
          <CheckCircle className="w-5 h-5" />
          הוחזר
        </Button>
        <p className="text-sm text-slate-600 mt-2 text-center">
          לחיצה תחזיר את כל הפריטים למלאי
        </p>
      </CardContent>
    </Card>
  );
}
