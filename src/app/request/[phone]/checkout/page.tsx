import { redirect } from "next/navigation";
import { CheckoutFlow } from "./checkout-flow";
import { getPublicStoreData } from "@/actions/soldier-request";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) redirect("/request");

  const storeData = await getPublicStoreData(phoneDigits);
  if ("error" in storeData) redirect(`/request?error=${encodeURIComponent(storeData.error || "שגיאה")}`);

  return (
    <CheckoutFlow
      handoverPhone={phoneDigits}
      storeName={storeData.storeName}
      department={storeData.department}
    />
  );
}
