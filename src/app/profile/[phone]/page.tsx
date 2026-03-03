import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getPublicStoreData } from "@/actions/soldier-request";
import { PublicStore } from "./public-store";
import { ProfileHeader } from "@/components/layout/profile-header";

export default async function RequestStorePage({
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
    getPublicStoreData(phoneDigits),
    auth(),
  ]);

  if ("error" in data) {
    redirect(`/profile?error=${encodeURIComponent(data.error || "שגיאה")}`);
  }

  const dataWithProfile = data as typeof data & {
    profile?: { name: string; role: string; phone: string; avatarUrl: string | null; coverUrl: string | null; bio: string | null };
  };
  const profile = dataWithProfile.profile ?? {
    name: data.storeName,
    role: "מפקד מחלקה",
    phone: data.handoverPhone || phoneDigits,
    avatarUrl: null as string | null,
    coverUrl: null as string | null,
    bio: null as string | null,
  };

  const userPhone = (session?.user?.phone || "").replace(/\D/g, "").slice(-10);
  const isOwner = !!userPhone && (phoneDigits === userPhone || phoneDigits.endsWith(userPhone) || userPhone.endsWith(phoneDigits));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <ProfileHeader
        showNotifications={isOwner}
        transparent
        handoverPhone={data.handoverPhone || phoneDigits}
        showOpenRequestButton={data.showOpenRequestButton}
      />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
        <PublicStore
          storeName={data.storeName}
          department={data.department}
          items={data.items}
          handoverPhone={data.handoverPhone || phoneDigits}
          showOpenRequestButton={data.showOpenRequestButton}
          profile={profile}
        />
      </Suspense>
    </div>
  );
}
