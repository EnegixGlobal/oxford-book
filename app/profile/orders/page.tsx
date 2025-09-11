'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const OrdersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('bookhaven-token');
    fetch('/api/orders', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => {
        if (j.success) setOrders(j.orders || []); else setError(j.message || 'Failed to load orders');
      })
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-5 h-5 animate-spin" /> Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading orders</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={() => router.refresh()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet. Start shopping to see your order history here.</p>
            <Button onClick={() => router.push('/')}>Start Shopping</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} className="border-b last:border-none align-top">
                  <td className="py-2 pr-4 font-medium">
                    <div className="flex gap-3 items-center">
                      {o.items?.[0]?.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.items[0].coverImage} alt={o.items[0].title} className="w-12 h-16 object-cover rounded" />
                      )}
                      <div>
                        <div className="text-sm font-semibold">{o.orderId}</div>
                        <div className="text-[11px] text-gray-500">{o.items?.[0]?.title?.slice(0,40)}{o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}</div>
                        <div className="text-[11px] text-emerald-600 mt-1">Delivery in 6–7 days</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{o.items?.length}</td>
                  <td className="py-2 pr-4 font-semibold">₹{o.totalAmount}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={o.paymentStatus === 'paid' ? 'default' : o.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>
                      {o.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="py-2">
                    <Link href={`/profile/orders/${o._id}`} className="inline-flex items-center gap-1 text-purple-600 hover:underline">
                      <Eye className="w-4 h-4" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
