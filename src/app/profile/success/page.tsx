import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default async function ProfileSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const phoneDigits = from ? from.replace(/\D/g, "").slice(-10) : "";
  const backToStore = phoneDigits.length >= 9 ? `/profile/${phoneDigits}` : "/about";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">ההשאלה נשלחה</h1>
        <p className="text-slate-500 mb-8">
          ההשאלה ממתינה לאישור. תקבל עדכון כשתאושר.
        </p>
        <Link href={backToStore}>
          <Button variant="outline">השאלה נוספת</Button>
        </Link>
      </div>
    </div>
  );
}
