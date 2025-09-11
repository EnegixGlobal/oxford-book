'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsDialog } from '@/components/ui/order-details-dialog';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';

interface AdminOrderRow { _id:string; orderId:string; customer:string; createdAt:string; totalAmount:number; status:string; itemsCount:number; paymentStatus?: string; }
type SelectedOrder = AdminOrderRow & { [key:string]: any };

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-500';
    case 'Processing':
      return 'bg-blue-500';
    case 'Shipped':
      return 'bg-purple-500';
    case 'Pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('bookhaven-token');
    fetch('/api/admin/orders', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(j => {
        if (j.success) setOrders(j.data || []); else setError(j.message || 'Failed to load');
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleUpdateOrder = (orderId: string, fields: any) => {
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, ...fields } : o)));
    setSelectedOrder((prev: any) => (prev && prev.orderId === orderId ? { ...prev, ...fields } : prev));
    toast.success('Order updated');
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const oid = (order.orderId || '').toString().toLowerCase();
    const cust = (order.customer || '').toString().toLowerCase();
    return oid.includes(term) || cust.includes(term);
  });

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Orders Management</h1>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by order ID or customer..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading orders...</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-red-600">{error}</td></tr>
            )}
            {!loading && !error && currentOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ₹{order.totalAmount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.itemsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.paymentStatus && (
                    <Badge variant={order.paymentStatus === 'paid' ? 'default' : order.paymentStatus === 'failed' ? 'destructive' : 'secondary'}>
                      {order.paymentStatus}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
        onUpdate={handleUpdateOrder}
      />
    </div>
  );
}
