'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderItem { title:string; price:number; quantity:number; subtotal:number; coverImage?:string }
interface OrderData {
  _id:string;
  orderId:string;
  items:OrderItem[];
  totalAmount:number;
  paymentStatus:string;
  status:string;
  createdAt:string;
  shippingAddress?: { fullName:string; phone:string; line1:string; line2?:string; city:string; state:string; postalCode:string };
  trackingInfo?: any;
}

const checkpointsOrder = ['orderPlaced','confirmed','shipped','delivered','cancelled'] as const;
const labels: Record<string,string> = {
  orderPlaced: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const token = localStorage.getItem('bookhaven-token');
    fetch(`/api/orders/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => {
        if (j.success) setOrder(j.data); else setError(j.message || 'Failed to load order');
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user) return null;

  if (loading) {
    return <div className="py-16 flex flex-col items-center text-gray-600"><Loader2 className="w-6 h-6 animate-spin" /> Loading order...</div>;
  }
  if (error || !order) {
    return <div className="py-16 text-center text-red-600 text-sm">{error || 'Order not found'}</div>;
  }

  const estDelivery = (() => {
    // rough estimate: 7 days from createdAt if not delivered or cancelled
    const created = new Date(order.createdAt).getTime();
    return new Date(created + 7*24*60*60*1000).toLocaleDateString();
  })();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <h1 className="text-2xl font-bold">Order {order.orderId}</h1>
        <Badge>{order.status}</Badge>
        <Badge variant={order.paymentStatus === 'paid' ? 'default' : order.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>{order.paymentStatus}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((it, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-16 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    {it.coverImage ? (
                      <Image src={it.coverImage} alt={it.title} width={64} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{it.title}</p>
                    <p className="text-xs text-gray-500">Qty: {it.quantity}</p>
                  </div>
                  <div className="text-sm font-semibold">₹{it.subtotal}</div>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-3 flex justify-between font-semibold">
              <span>Total</span><span className="text-purple-600">₹{order.totalAmount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Estimated delivery by <span className="font-medium">{estDelivery}</span></p>
          </div>

          {/* Tracking */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-4">Tracking</h2>
            {/* Progressive Stepper */}
            {(() => {
              const steps = [
                { key: 'orderPlaced', label: 'Placed' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'shipped', label: 'Shipped' },
                { key: 'delivered', label: 'Delivered' },
              ];
              const tracking = order.trackingInfo || {};
              let lastReached = -1;
              steps.forEach((s, i) => { if (tracking[s.key]) lastReached = i; });
              const cancelled = tracking.cancelled;
              return (
                <ol className="space-y-6">
                  {steps.map((s, i) => {
                    const info = tracking[s.key];
                    const reached = !!info;
                    const nextReached = i < lastReached;
                    const isLast = i === steps.length - 1;
                    return (
                      <li key={s.key} className="relative pl-8">
                        {/* Vertical connector (below marker) */}
                        {!isLast && (
                          <span className={`absolute left-[6px] top-3 w-[2px] h-full ${i < lastReached ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        )}
                        {/* Marker */}
                        <span className={`absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2 ring-white shadow ${reached ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'}`}></span>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-medium text-sm flex flex-wrap items-center gap-2">
                            {s.label}
                            {reached && <span className="text-xs text-gray-500">{new Date(info.timestamp).toLocaleDateString()}</span>}
                            {!reached && i === lastReached + 1 && lastReached >= 0 && (<span className="text-[10px] text-amber-600">In progress</span>)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reached ? info.status : (i === 0 ? 'Creating order' : 'Pending')}
                          </p>
                          {isLast && !reached && !cancelled && (
                            <p className="text-xs text-emerald-600 mt-1">Item expected within 6–7 days.</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {cancelled && (
                    <li className="relative pl-8">
                      <span className="absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2 ring-white shadow bg-red-500 text-white"></span>
                      <div className="flex flex-col gap-0.5">
                        <p className="font-medium text-sm flex flex-wrap items-center gap-2 text-red-600">Cancelled <span className="text-xs text-red-400">{new Date(cancelled.timestamp).toLocaleDateString()}</span></p>
                        <p className="text-xs text-red-500">{cancelled.status}</p>
                      </div>
                    </li>
                  )}
                </ol>
              );
            })()}
          </div>
        </div>
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-3">Shipping Address</h2>
            {order.shippingAddress ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}{order.shippingAddress.line2 ? <><br />{order.shippingAddress.line2}</> : null}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                Phone: {order.shippingAddress.phone}
              </p>
            ) : <p className="text-xs text-gray-500">No address saved</p>}
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-3">Need Help?</h2>
            <p className="text-xs text-gray-600 mb-3">If there is any issue with your order or delivery, contact support.</p>
            <Link href="/contact"><Button size="sm" variant="outline">Contact Support</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
