import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CheckoutFlow } from "./checkout-flow";
import { getPublicStoreData } from "@/actions/soldier-request";
import { ProfileHeader } from "@/components/layout/profile-header";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) redirect("/profile");

  const [storeData, session] = await Promise.all([
    getPublicStoreData(phoneDigits),
    auth(),
  ]);

  if ("error" in storeData) redirect(`/profile?error=${encodeURIComponent(storeData.error || "שגיאה")}`);

  const userPhone = (session?.user?.phone || "").replace(/\D/g, "").slice(-10);
  const isOwner = !!userPhone && (phoneDigits === userPhone || phoneDigits.endsWith(userPhone) || userPhone.endsWith(phoneDigits));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <ProfileHeader
        handoverPhone={phoneDigits}
        showOpenRequestButton={storeData.showOpenRequestButton}
        showNotifications={isOwner}
      />
      <CheckoutFlow
        handoverPhone={phoneDigits}
        storeName={storeData.storeName}
        department={storeData.department}
        items={storeData.items}
      />
    </div>
  );
}
