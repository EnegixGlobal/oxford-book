import { Suspense } from "react";
import PaymentSuccessClient from "./success-client";

// This must be async because searchParams is async in App Router
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams; // ✅ await the searchParams
  const orderIdParam = params.orderId;
  const mongoOrderId = Array.isArray(orderIdParam)
    ? orderIdParam[0]
    : orderIdParam;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-10">
          <div className="max-w-2xl w-full bg-white shadow-xl rounded-xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-gray-600">Preparing payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessClient orderId={mongoOrderId} />
    </Suspense>
  );
}