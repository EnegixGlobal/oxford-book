"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';

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
  paymentMethod?: 'online' | 'cod';
  status: string;
  items: OrderItem[];
  createdAt: string;
  trackingInfo?: any;
}

export default function PaymentSuccessClient({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

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
    let interval: any = null;
    let shouldContinueVerification = true;
    let countdownTimer: any = null;
    let countdownIntervalRef: any = null;

    // Helper function to start countdown immediately
    const startCountdown = () => {
      if (countdownTimer || countdownIntervalRef) return; // Already started
      
      setRedirectCountdown(3);
      let currentCount = 3;
      
      // Countdown interval - update every second
      countdownIntervalRef = setInterval(() => {
        currentCount--;
        if (currentCount <= 0) {
          clearInterval(countdownIntervalRef);
          setRedirectCountdown(0);
        } else {
          setRedirectCountdown(currentCount);
        }
      }, 1000);

      // Redirect after 3 seconds
      countdownTimer = setTimeout(() => {
        router.push('/cart');
      }, 3000);
    };

    const verifyOnce = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`, { headers });
        const json = await res.json();
        if (!res.ok || !json.success) {
          // If order not found, it might have been deleted already (cancelled/failed)
          if (res.status === 404) {
            // Order was already deleted - treat as cancelled
            setVerifying(false);
            setVerificationComplete(true);
            shouldContinueVerification = false;
            setLoading(false);
            startCountdown();
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            return false;
          }
          setError(json.message || 'Failed to load order');
          setLoading(false);
          setVerificationComplete(true);
          shouldContinueVerification = false;
          return false;
        }
        setOrder(json.data);
        setLoading(false);
        
        // Clear cart only when payment is confirmed as 'paid' (or COD which is already handled)
        if (json.data.paymentStatus === 'paid') {
          clearCart(); // Clear cart only after successful payment
        }
        
        // Check if payment was never initiated (no paymentOrderId and still pending)
        // If it's COD, treat it as successful order placement
        // If payment was cancelled/not initiated for online payment, show the page and redirect after 3 seconds with countdown
        if (json.data.paymentStatus === 'pending' && !(json.data as any).paymentOrderId) {
          // Check if it's a COD order
          if (json.data.paymentMethod === 'cod') {
            // COD order - treat as successful order placement (cart already cleared in checkout)
            setVerifying(false);
            setVerificationComplete(true);
            shouldContinueVerification = false;
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            return false; // Stop verification
          } else {
            // Payment was cancelled or never completed for online payment
            // Delete the order immediately since payment was cancelled - don't keep cancelled orders
            const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
            const deleteHeaders: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};
            try {
              const deleteRes = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: deleteHeaders
              });
              const deleteJson = await deleteRes.json();
              if (!deleteRes.ok || !deleteJson.success) {
                console.error('Failed to delete cancelled order:', deleteJson.message);
                // If deletion fails, at least cancel it
                try {
                  await fetch(`/api/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...deleteHeaders }
                  });
                } catch (cancelErr) {
                  console.error('Failed to cancel order:', cancelErr);
                }
              } else {
                console.log('Cancelled order deleted successfully');
              }
            } catch (deleteErr) {
              console.error('Failed to delete cancelled order:', deleteErr);
              // If deletion fails, at least cancel it
              try {
                await fetch(`/api/orders/${orderId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', ...deleteHeaders }
                });
              } catch (cancelErr) {
                console.error('Failed to cancel order:', cancelErr);
              }
            }
            // Don't clear cart - user cancelled, they should keep their items
            setVerifying(false);
            setVerificationComplete(true);
            shouldContinueVerification = false;
            // Start countdown immediately when cancellation detected
            startCountdown();
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            return false; // Stop verification immediately
          }
        }
        
        if (json.data.paymentStatus === 'paid' || json.data.paymentStatus === 'failed') {
          // If payment failed, delete the order immediately (user cancelled or payment failed)
          if (json.data.paymentStatus === 'failed') {
            const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
            const deleteHeaders: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};
            try {
              const deleteRes = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: deleteHeaders
              });
              const deleteJson = await deleteRes.json();
              if (!deleteRes.ok || !deleteJson.success) {
                console.error('Failed to delete failed order:', deleteJson.message);
              } else {
                console.log('Failed order deleted successfully');
              }
            } catch (deleteErr) {
              console.error('Failed to delete failed order:', deleteErr);
            }
          }
          setVerificationComplete(true);
          setVerifying(false);
          shouldContinueVerification = false;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return false;
        }
        
        // Only verify if paymentOrderId exists (payment was initiated)
        if ((json.data as any).paymentOrderId) {
          setVerifying(true);
          const vRes = await fetch('/api/payments/phonepe/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ orderMongoId: orderId })
          });
          const vJson = await vRes.json();
          if (vRes.ok && vJson.success) {
            // If order was deleted during verification (payment failed/cancelled)
            if (vJson.data.deleted) {
              setVerificationComplete(true);
              setVerifying(false);
              shouldContinueVerification = false;
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
              // Don't clear cart - payment failed/cancelled, user should keep items
              return false;
            }
            setOrder(vJson.data.order);
            
            // Check if gateway state indicates cancellation even if order still exists
            const gatewayState = vJson.data.gatewayState;
            if (gatewayState === 'CANCELLED' || gatewayState === 'CANCELED' || gatewayState === 'FAILED') {
              // Payment was cancelled - delete the order
              const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
              const deleteHeaders: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};
              try {
                const deleteRes = await fetch(`/api/orders/${orderId}`, {
                  method: 'DELETE',
                  headers: deleteHeaders
                });
                const deleteJson = await deleteRes.json();
                if (!deleteRes.ok || !deleteJson.success) {
                  console.error('Failed to delete cancelled order:', deleteJson.message);
                  // If deletion fails, at least cancel it
                  try {
                    await fetch(`/api/orders/${orderId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', ...deleteHeaders }
                    });
                  } catch (cancelErr) {
                    console.error('Failed to cancel order:', cancelErr);
                  }
                } else {
                  console.log('Cancelled order deleted successfully');
                }
              } catch (deleteErr) {
                console.error('Failed to delete cancelled order:', deleteErr);
              }
              setVerificationComplete(true);
              setVerifying(false);
              shouldContinueVerification = false;
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
              // Don't clear cart - payment cancelled, user should keep items
              return false;
            }
            
            // Clear cart when payment is confirmed as 'paid'
            if (vJson.data.order.paymentStatus === 'paid') {
              clearCart();
            }
            if (vJson.data.order.paymentStatus === 'paid' || vJson.data.order.paymentStatus === 'failed') {
              setVerificationComplete(true);
              setVerifying(false);
              shouldContinueVerification = false;
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
              return false;
            }
          }
          return true; // Continue verification
        }
        
        return true; // Continue if still pending with paymentOrderId
      } catch {
        return false;
      }
      finally {
        if (!initial) {
        setVerifying(false);
      }
      }
    };

    // Start initial verification and only set up interval if payment was initiated
    verifyOnce(true).then((shouldContinue) => {
      // Only set up interval if payment was actually initiated (not cancelled)
      if (shouldContinue && shouldContinueVerification) {
        interval = setInterval(async () => {
          if (!shouldContinueVerification) {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            return;
          }
          attempts++;
          if (attempts >= 10) { // 10 attempts = 30 seconds
            setMaxAttemptsReached(true);
            setVerificationComplete(true);
            setVerifying(false);
            shouldContinueVerification = false;
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            // If still pending after max attempts, likely cancelled - delete the order
            const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
            const deleteHeaders: Record<string,string> = token ? { Authorization: `Bearer ${token}` } : {};
            // Check order status one more time before deleting
            fetch(`/api/orders/${orderId}`, { headers: deleteHeaders })
              .then(res => res.json())
              .then(json => {
                if (json.success && json.data.paymentStatus === 'pending') {
                  // Still pending after 30 seconds - treat as cancelled and delete
                  fetch(`/api/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: deleteHeaders
                  }).then(deleteRes => deleteRes.json()).then(deleteJson => {
                    if (!deleteJson.success) {
                      console.error('Failed to delete pending order after timeout:', deleteJson.message);
                    } else {
                      console.log('Pending order deleted after timeout (likely cancelled)');
                    }
                  }).catch(err => {
                    console.error('Error deleting pending order after timeout:', err);
                  });
                }
              })
              .catch(err => {
                console.error('Error checking order status before timeout deletion:', err);
              });
            return;
          }
          const continueCheck = await verifyOnce(false);
          if (!continueCheck) {
            shouldContinueVerification = false;
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        }, 3000);
      }
    });

    return () => {
      shouldContinueVerification = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
      }
      if (countdownIntervalRef) {
        clearInterval(countdownIntervalRef);
        countdownIntervalRef = null;
      }
    };
  }, [orderId]);

  const isPaid = order?.paymentStatus === 'paid';
  const isFailed = order?.paymentStatus === 'failed';
  const isCOD = order?.paymentMethod === 'cod' && order?.paymentStatus === 'pending' && !(order as any).paymentOrderId;
  const isPending = order?.paymentStatus === 'pending' && verificationComplete && !isCOD;
  const paymentNotInitiated = order?.paymentStatus === 'pending' && !(order as any).paymentOrderId && !isCOD && verificationComplete;

  // Trigger redirect countdown for cancelled payment (paymentNotInitiated)
  useEffect(() => {
    if (paymentNotInitiated && redirectCountdown !== null && redirectCountdown > 0) {
      let currentCount = redirectCountdown;
      // Countdown interval - update every second
      const countdownInterval = setInterval(() => {
        currentCount--;
        if (currentCount <= 0) {
          clearInterval(countdownInterval);
          setRedirectCountdown(0);
        } else {
          setRedirectCountdown(currentCount);
        }
      }, 1000);

      // Redirect after the remaining seconds
      const remainingSeconds = currentCount * 1000;
      const t = setTimeout(() => {
        router.push('/cart');
      }, remainingSeconds);

      return () => {
        clearTimeout(t);
        clearInterval(countdownInterval);
      };
    }
  }, [paymentNotInitiated, redirectCountdown, router]);

  // Auto redirect to orders page after a short delay once paid or COD order placed
  useEffect(() => {
    if (isPaid || isCOD) {
      const t = setTimeout(() => {
        router.push('/profile/orders');
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [isPaid, isCOD, router]);

  // Auto redirect to cart page if payment not paid (cancelled, failed, or not initiated) - but NOT for COD
  useEffect(() => {
    if (verificationComplete && !isPaid && !isCOD && (isFailed || paymentNotInitiated || (isPending && maxAttemptsReached))) {
      // Start countdown from 3
      setRedirectCountdown(3);
      
      let currentCount = 3;
      // Countdown interval - update every second
      const countdownInterval = setInterval(() => {
        currentCount--;
        if (currentCount <= 0) {
          clearInterval(countdownInterval);
          setRedirectCountdown(0);
        } else {
          setRedirectCountdown(currentCount);
        }
      }, 1000);

      // Redirect after 3 seconds
      const t = setTimeout(() => {
        router.push('/cart');
      }, 3000);

      return () => {
        clearTimeout(t);
        clearInterval(countdownInterval);
        setRedirectCountdown(null);
      };
    } else {
      setRedirectCountdown(null);
    }
  }, [verificationComplete, isPaid, isCOD, isFailed, paymentNotInitiated, isPending, maxAttemptsReached, router]);


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
              {isPaid || isCOD ? (
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
              ) : isFailed || paymentNotInitiated ? (
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
              ) : (
                <Loader2 className="w-16 h-16 text-amber-500 mb-4 animate-spin" />
              )}
              <h1 className="text-3xl font-bold mb-2">
                {isPaid || isCOD ? 'Order Confirmed' : isFailed ? 'Payment Failed' : paymentNotInitiated ? 'Payment Cancelled' : 'Payment Pending'}
              </h1>
              <p className="text-gray-600 space-y-1">
                {isPaid && (
                  <span>
                    Thank you! Your payment was successful. Your books will be delivered in 6–7 days.
                  </span>
                )}
                {isCOD && (
                  <span>
                    Thank you! Your order has been placed successfully. Pay when you receive your order. Your books will be delivered in few days.
                  </span>
                )}
                {isFailed && 'Unfortunately the payment failed. Redirecting you back to cart...'}
                {paymentNotInitiated && 'Payment was not completed. Redirecting you back to cart...'}
                {isPending && !paymentNotInitiated && maxAttemptsReached && 'We couldn\'t verify your payment status. Redirecting you back to cart...'}
                {!isPaid && !isFailed && !paymentNotInitiated && !isCOD && !maxAttemptsReached && 'We are waiting for payment confirmation. This may take a few seconds.'}
              </p>
              {(isPaid || isCOD) && (
                <p className="text-xs text-emerald-600 mt-2">Redirecting to your orders page…</p>
              )}
              {paymentNotInitiated && redirectCountdown !== null && (
                <p className="text-xs text-amber-600 mt-2 font-semibold">
                  Redirecting to cart page in <span className="font-bold text-orange-600">{redirectCountdown}</span> second{redirectCountdown !== 1 ? 's' : ''}…
                </p>
              )}
              {verificationComplete && !isPaid && !paymentNotInitiated && (isFailed || (isPending && maxAttemptsReached)) && redirectCountdown !== null && (
                <p className="text-xs text-amber-600 mt-2 font-semibold">
                  Redirecting to cart page in <span className="font-bold text-orange-600">{redirectCountdown}</span> second{redirectCountdown !== 1 ? 's' : ''}…
                </p>
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
              {verifying && !isPaid && !isFailed && !isCOD && (
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
              {(paymentNotInitiated || (isPending && maxAttemptsReached)) && (
                <Link href="/cart"><Button variant="secondary">Back to Cart</Button></Link>
              )}
              {!isPaid && !isFailed && !paymentNotInitiated && !isCOD && !maxAttemptsReached && (
                <Button variant="secondary" onClick={() => router.refresh()}>Refresh Status</Button>
              )}
              {(isPaid || isCOD) && (
                <Link href={`/profile/orders`}><Button variant="secondary">Go to Orders Now</Button></Link>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
