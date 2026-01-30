'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';

const OrdersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  useEffect(() => { setCurrentPage(1); }, [orders.length]);

  const handleCancelOrder = async (orderId: string, orderStatus: string, paymentStatus: string) => {
    if (orderStatus === 'cancelled' || orderStatus === 'shipped' || orderStatus === 'delivered') {
      toast.error('Cannot cancel order that has been shipped or delivered');
      return;
    }
    
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const token = localStorage.getItem('bookhaven-token');
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Order cancelled successfully');
        // Refresh orders
        const ordersResponse = await fetch('/api/orders', { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          setOrders(ordersData.orders || []);
        }
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const canCancelOrder = (orderStatus: string, paymentStatus: string) => {
    // Can cancel if order is in 'created' or 'confirmed' status (not shipped/delivered/cancelled)
    return orderStatus !== 'cancelled' && 
           orderStatus !== 'shipped' && 
           orderStatus !== 'delivered';
  };

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
        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {paginatedOrders.map(o => (
            <div key={o._id} className="border rounded-lg p-3 flex gap-3 bg-white">
              {o.items?.[0]?.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.items[0].coverImage} alt={o.items[0].title} className="w-14 h-20 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold break-all leading-snug">{o.orderId}</div>
                  <Badge className="shrink-0" variant={o.paymentStatus === 'paid' ? 'default' : o.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>{o.paymentStatus}</Badge>
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-1">{o.items?.[0]?.title?.slice(0,50)}{o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-500">
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span>• {o.items?.length} items</span>
                  <span className="text-emerald-600 font-medium">₹{o.totalAmount}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] h-5 px-2">{o.status}</Badge>
                  <span className="text-[10px] text-emerald-600">Delivery 6–7 days</span>
                  <div className="ml-auto flex items-center gap-2">
                    {canCancelOrder(o.status, o.paymentStatus) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(o._id, o.status, o.paymentStatus)}
                        className="h-6 px-2 text-[10px] font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                      >
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                    <Link href={`/profile/orders/${o._id}`} className="text-[11px] text-purple-600 hover:underline inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Tablet Table */}
        <div className="overflow-x-auto -mx-2 sm:mx-0 hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4 hidden sm:table-cell">Items</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4 hidden sm:table-cell">Payment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map(o => (
                <tr key={o._id} className="border-b last:border-none align-top">
                  <td className="py-2 pr-4 font-medium">
                    <div className="flex gap-3 items-center">
                      {o.items?.[0]?.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.items[0].coverImage} alt={o.items[0].title} className="w-12 h-16 object-cover rounded" />
                      )}
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold">{o.orderId}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[160px] sm:max-w-none">{o.items?.[0]?.title?.slice(0,40)}{o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}</div>
                        <div className="text-[11px] text-emerald-600">Delivery in 6–7 days</div>
                        {/* Mobile meta row (hidden on sm+) */}
                        <div className="flex flex-wrap items-center gap-1 sm:hidden pt-0.5">
                          <span className="text-[10px] text-gray-500">{o.items?.length} items</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <Badge variant={o.paymentStatus === 'paid' ? 'default' : o.paymentStatus === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0 h-4">{o.paymentStatus}</Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-xs sm:text-sm align-top">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell">{o.items?.length}</td>
                  <td className="py-2 pr-4 font-semibold">₹{o.totalAmount}</td>
                  <td className="py-2 pr-4 hidden sm:table-cell">
                    <Badge variant={o.paymentStatus === 'paid' ? 'default' : o.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>
                      {o.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {canCancelOrder(o.status, o.paymentStatus) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(o._id, o.status, o.paymentStatus)}
                          className="h-7 px-2.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                      <Link href={`/profile/orders/${o._id}`} className="inline-flex items-center gap-1 text-purple-600 hover:underline text-xs sm:text-sm">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pt-4">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p:number) => setCurrentPage(p)}
              totalItems={orders.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
