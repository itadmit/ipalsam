import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getOpenRequestPageData } from "@/actions/soldier-request";
import { OpenRequestPageContent } from "./open-request-content";
import { ProfileHeader } from "@/components/layout/profile-header";

export default async function OpenRequestPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneParam } = await params;
  const phoneDigits = phoneParam.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) {
    redirect("/profile");
  }

  const [data, session] = await Promise.all([
    getOpenRequestPageData(phoneDigits),
    auth(),
  ]);

  if ("error" in data) {
    redirect(`/profile?error=${encodeURIComponent(data.error || "שגיאה")}`);
  }

  if (!data.showOpenRequestButton) {
    redirect(`/profile/${phoneDigits}`);
  }

  const { department, handoverPhone, storeName } = data;

  const userPhone = (session?.user?.phone || "").replace(/\D/g, "").slice(-10);
  const isOwner = !!userPhone && (phoneDigits === userPhone || phoneDigits.endsWith(userPhone) || userPhone.endsWith(phoneDigits));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <ProfileHeader
        handoverPhone={phoneDigits}
        showOpenRequestButton={data.showOpenRequestButton}
        showNotifications={isOwner}
      />
      <div className="max-w-lg mx-auto">
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
