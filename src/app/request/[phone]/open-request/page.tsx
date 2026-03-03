import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOpenRequestPageData } from "@/actions/soldier-request";
import { OpenRequestPageContent } from "./open-request-content";
import { ArrowRight, Phone, User } from "lucide-react";
import Link from "next/link";

export default async function OpenRequestPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneParam } = await params;
  const phoneDigits = phoneParam.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) {
    redirect("/request");
  }

  const data = await getOpenRequestPageData(phoneDigits);
  if ("error" in data) {
    redirect(`/request?error=${encodeURIComponent(data.error || "שגיאה")}`);
  }

  if (!data.showOpenRequestButton) {
    redirect(`/request/${phoneDigits}`);
  }

  const d = data as typeof data & { profile: { name: string; role: string; phone: string } };
  const { profile, department, handoverPhone, storeName } = d;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="max-w-lg mx-auto">
        {/* פרופיל - כמו פייסבוק */}
        <div className="bg-white rounded-b-3xl shadow-sm overflow-hidden">
          {/* כיסוי */}
          <div
            className="h-32 sm:h-40 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700"
            style={{
              backgroundImage: `linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)`,
            }}
          />
          <div className="px-4 pb-6 -mt-14 relative">
            {/* תמונה עגולה */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-lg overflow-hidden">
              <User className="w-12 h-12 text-slate-500" />
            </div>
            {/* שם ותפקיד */}
            <h1 className="text-xl font-bold text-slate-900 mt-3">{profile.name}</h1>
            <p className="text-slate-600 text-sm">{profile.role} • {department.name}</p>
            <a
              href={`tel:${handoverPhone}`}
              className="mt-2 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              {profile.phone}
            </a>
          </div>
        </div>

        {/* חזרה לחנות */}
        <Link
          href={`/request/${phoneDigits}`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 py-4 px-4 text-sm"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          חזרה לחנות
        </Link>

        {/* טופס הבקשה */}
        <Suspense fallback={<div className="p-6 text-center text-slate-500">טוען...</div>}>
          <OpenRequestPageContent
            departmentId={department.id}
            handoverPhone={handoverPhone}
            storeName={storeName}
          />
        </Suspense>
      </div>
    </div>
  );
}
