'use client';

import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsDialog } from '@/components/ui/order-details-dialog';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';

const sampleOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    date: '2025-09-07',
    total: 2499,
    status: 'Delivered',
    items: 3,
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    date: '2025-09-06',
    total: 1899,
    status: 'Processing',
    items: 2,
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-003',
    customer: 'Mike Johnson',
    date: '2025-09-06',
    total: 3299,
    status: 'Shipped',
    items: 4,
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-004',
    customer: 'Sarah Williams',
    date: '2025-09-05',
    total: 999,
    status: 'Pending',
    items: 1,
    paymentStatus: 'Pending'
  },
];

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
  const [orders, setOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleUpdateOrder = (id: string, fields: any) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...fields } : o)));
    setSelectedOrder((prev: any) => (prev && prev.id === id ? { ...prev, ...fields } : prev));
    toast.success('Order updated');
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {currentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ₹{order.total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.items}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
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
