export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import SuccessClient, { LoadingFallback } from './SuccessClient';

export default function PaymentSuccessPage() {
  // Server wrapper to provide proper dynamic rendering & suspense boundary.
  return (
    <Suspense fallback={<LoadingFallback />}> 
      <SuccessClient />
    </Suspense>
  );
}
