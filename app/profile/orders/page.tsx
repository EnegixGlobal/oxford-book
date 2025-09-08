'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

const OrdersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">
            You haven't placed any orders yet. Start shopping to see your order history here.
          </p>
          <Button onClick={() => router.push('/')}>
            Start Shopping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
