'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, ArrowLeft, FileDown, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (order.status === 'cancelled' || order.status === 'shipped' || order.status === 'delivered') {
      toast.error('Cannot cancel order that has been shipped or delivered');
      return;
    }
    
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const token = localStorage.getItem('bookhaven-token');
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Order cancelled successfully');
        // Refresh order data
        const orderResponse = await fetch(`/api/orders/${order._id}`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        const orderData = await orderResponse.json();
        if (orderData.success) {
          setOrder(orderData.data);
        }
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const canCancelOrder = () => {
    if (!order) return false;
    // Can cancel if order is in 'created' or 'confirmed' status (not shipped/delivered/cancelled)
    return order.status !== 'cancelled' && 
           order.status !== 'shipped' && 
           order.status !== 'delivered';
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    const txnNo = (order.trackingInfo && (order.trackingInfo.paymentId || order.trackingInfo.transactionId)) || order.orderId;
    const created = new Date(order.createdAt).toLocaleString();
    // Build items rows
    const itemRows = order.items.map((it, idx) => {
      const original = (it as any).mrp || it.price || it.subtotal / it.quantity;
      const finalUnit = (it as any).discountedPrice || it.price || (it.subtotal / it.quantity);
      const discountPerUnit = original - finalUnit;
      const discountPct = original ? ((discountPerUnit / original) * 100).toFixed(0) : '0';
      return `<tr>
        <td style=\"padding:6px;border:1px solid #e5e7eb;font-size:12px;\">${idx + 1}</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;font-size:12px;\">${it.title}</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;text-align:center;font-size:12px;\">${it.quantity}</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;text-align:right;font-size:12px;\">₹${original}</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;text-align:right;font-size:12px;\;color:#dc2626\">${discountPct}%</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;text-align:right;font-size:12px;\">₹${finalUnit}</td>
        <td style=\"padding:6px;border:1px solid #e5e7eb;text-align:right;font-size:12px;font-weight:600;\">₹${it.subtotal}</td>
      </tr>`;
    }).join('');

    const totalMrp = order.items.reduce((sum, it:any) => {
      const original = it.mrp || it.price || it.subtotal / it.quantity; return sum + (original * it.quantity);
    }, 0);
    const totalFinal = order.totalAmount;
    const totalDiscount = totalMrp - totalFinal;

    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Invoice ${order.orderId}</title>
      <style>
        body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;padding:24px;color:#111827;}
        h1{font-size:20px;margin:0 0 4px;font-weight:600;}
        h2{font-size:14px;margin:24px 0 8px;font-weight:600;}
        table{border-collapse:collapse;width:100%;}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:12px;}
        .box{border:1px solid #e5e7eb;border-radius:6px;padding:12px;}
        .totals td{padding:4px 6px;font-size:12px;}
        .right{text-align:right;}
        @media print { .no-print { display:none !important;} body{padding:0;} }
      </style></head><body>
      <div style='display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;'>
        <div>
          <h1>Invoice</h1>
          <div style='font-size:12px'>Order No: <strong>${order.orderId}</strong><br/>Transaction No: <strong>${txnNo}</strong><br/>Date: ${created}</div>
        </div>
        <div style='text-align:right;font-size:12px'>Status: <strong>${order.status}</strong><br/>Payment: <strong>${order.paymentStatus}</strong></div>
      </div>
      <div class='grid' style='margin-top:20px;'>
        <div class='box'>
          <div style='font-size:12px;font-weight:600;margin-bottom:6px;'>Billed / Shipped To</div>
          <div style='font-size:12px;line-height:1.4;'>${order.shippingAddress ? `${order.shippingAddress.fullName}<br/>${order.shippingAddress.line1}${order.shippingAddress.line2 ? '<br/>' + order.shippingAddress.line2 : ''}<br/>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br/>Phone: ${order.shippingAddress.phone}` : 'No address'}</div>
        </div>
        <div class='box'>
          <div style='font-size:12px;font-weight:600;margin-bottom:6px;'>Summary</div>
          <table class='totals' style='width:100%;'>
            <tbody>
              <tr><td>Items Total (MRP)</td><td class='right'>₹${totalMrp.toFixed(2)}</td></tr>
              <tr><td>Discount</td><td class='right' style='color:#dc2626'>-₹${totalDiscount.toFixed(2)}</td></tr>
              <tr><td style='font-weight:600;'>Grand Total</td><td class='right' style='font-weight:600;'>₹${totalFinal.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <h2 style='margin-top:28px;'>Items</h2>
      <table style='margin-top:4px;'>
        <thead>
          <tr>
            <th style='text-align:left;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>S.no</th>
            <th style='text-align:left;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Title</th>
            <th style='text-align:center;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Qty</th>
            <th style='text-align:right;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Original</th>
            <th style='text-align:right;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Disc%</th>
            <th style='text-align:right;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Final/Unit</th>
            <th style='text-align:right;padding:6px;border:1px solid #e5e7eb;font-size:12px;'>Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style='margin-top:32px;font-size:11px;color:#6b7280;'>This is a system generated invoice. For support visit the contact page.</p>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => { win.print(); };
    } else {
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${order.orderId}.html`; a.click();
      URL.revokeObjectURL(url);
    }
  };

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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hidden sm:inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <h1 className="text-xl sm:text-2xl font-bold break-words">Order {order.orderId}</h1>
        <Badge>{order.status}</Badge>
        <Badge variant={order.paymentStatus === 'paid' ? 'default' : order.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>{order.paymentStatus}</Badge>
        <div className="ml-auto sm:ml-0 flex items-center gap-2">
          {canCancelOrder() && (
            <Button 
              onClick={handleCancelOrder} 
              size="sm" 
              variant="outline"
              className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200"
            >
              <X className="w-3.5 h-3.5" /> Cancel Order
            </Button>
          )}
          <Button onClick={handleDownloadInvoice} size="sm" variant="outline" className="flex items-center gap-1">
            <FileDown className="w-4 h-4" /> Invoice
          </Button>
        </div>
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
