import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPublicStoreData } from "@/actions/soldier-request";
import { PublicStore } from "./public-store";

export default async function RequestStorePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: phoneParam } = await params;
  const phoneDigits = phoneParam.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) {
    redirect("/request");
  }

  const data = await getPublicStoreData(phoneDigits);
  if ("error" in data) {
    redirect(`/request?error=${encodeURIComponent(data.error || "שגיאה")}`);
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <PublicStore
        storeName={data.storeName}
        department={data.department}
        items={data.items}
        handoverPhone={phoneDigits}
      />
    </Suspense>
  );
}
