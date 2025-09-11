"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  coverImage?: string;
}

interface OrderData {
  _id: string;
  orderId: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: string;
  items: OrderItem[];
  createdAt: string;
  trackingInfo?: any;
}

export default function PaymentSuccessClient({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details and attempt verification
  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference');
      setLoading(false);
      setVerifying(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
    const headers: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};

  let attempts = 0;
    let interval: any;

    const verifyOnce = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`, { headers });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.message || 'Failed to load order');
          setLoading(false);
          return;
        }
        setOrder(json.data);
        setLoading(false);
        if (json.data.paymentStatus === 'paid' || json.data.paymentStatus === 'failed') {
          setVerifying(false);
          if (interval) clearInterval(interval);
          return;
        }
        setVerifying(true);
        const vRes = await fetch('/api/payments/phonepe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ orderMongoId: orderId })
        });
        const vJson = await vRes.json();
        if (vRes.ok && vJson.success) {
          setOrder(vJson.data.order);
          if (vJson.data.order.paymentStatus === 'paid' || vJson.data.order.paymentStatus === 'failed') {
            setVerifying(false);
            if (interval) clearInterval(interval);
            return;
          }
        }
      } catch {}
      finally {
        setVerifying(false);
      }
    };

    verifyOnce(true);
    interval = setInterval(() => {
      attempts++;
      if (attempts >= 10) { // extend attempts for slower confirmations
        clearInterval(interval);
        return;
      }
      verifyOnce();
    }, 3000);

    return () => interval && clearInterval(interval);
  }, [orderId]);

  const isPaid = order?.paymentStatus === 'paid';
  const isFailed = order?.paymentStatus === 'failed';

  // Auto redirect to orders page after a short delay once paid
  useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => {
        router.push('/profile/orders');
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [isPaid, router]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-10">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-xl p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            <p className="text-gray-600">Loading your order...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <h1 className="text-2xl font-semibold">Error</h1>
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-3 mt-4">
              <Link href="/"><Button>Go Home</Button></Link>
              <Button variant="outline" onClick={() => router.back()}>Back</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              {isPaid ? (
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
              ) : isFailed ? (
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
              ) : (
                <Loader2 className="w-16 h-16 text-amber-500 mb-4 animate-spin" />
              )}
              <h1 className="text-3xl font-bold mb-2">
                {isPaid ? 'Order Confirmed' : isFailed ? 'Payment Failed' : 'Payment Pending'}
              </h1>
              <p className="text-gray-600 space-y-1">
                {isPaid && (
                  <span>
                    Thank you! Your payment was successful. Your books will be delivered in 6–7 days.
                  </span>
                )}
                {isFailed && 'Unfortunately the payment failed. You can retry from your orders page.'}
                {!isPaid && !isFailed && 'We are waiting for payment confirmation. This may take a few seconds.'}
              </p>
              {isPaid && (
                <p className="text-xs text-emerald-600 mt-2">Redirecting to your orders page…</p>
              )}
              <div className="mt-3 text-sm text-gray-500">Merchant Order ID: {order?.orderId}</div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 mb-6">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-medium">Order Total</span>
                <span className="font-semibold text-emerald-700">₹{order?.totalAmount}</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {order?.items.map((it, idx) => (
                  <div key={`it-${idx}`} className="flex justify-between text-sm">
                    <span className="truncate max-w-[60%]">{it.title} × {it.quantity}</span>
                    <span>₹{it.subtotal}</span>
                  </div>
                ))}
              </div>
              {verifying && !isPaid && !isFailed && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying payment...
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/"><Button>Continue Shopping</Button></Link>
              {user && (
                <Link href="/profile/orders"><Button variant="outline">View My Orders</Button></Link>
              )}
              {!isPaid && !isFailed && (
                <Button variant="secondary" onClick={() => router.refresh()}>Refresh Status</Button>
              )}
              {isPaid && (
                <Link href={`/profile/orders`}><Button variant="secondary">Go to Orders Now</Button></Link>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
